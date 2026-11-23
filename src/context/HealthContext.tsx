import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { computeBiomarkerStatus } from '../data/mockHealthData';
import { healthStorageService } from '../services/healthStorageService';
import {
  BioimpedanceEntry,
  Biomarker,
  BiomarkerCategory,
  ExtractedBiomarkerDraft,
  HealthState,
  LabExamRecord,
  ScaleMeasurement,
  ScreenId,
} from '../types/health';

export interface NewMeasurementInput {
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  visceralFat?: number;
  waterPct?: number;
  boneMassKg?: number;
  isoDate?: string;
}

export interface NewScaleMeasurementInput {
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  isoDate?: string;
  time?: string;
}

interface HealthContextValue {
  state: HealthState;
  screen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  selectedBiomarkerId: string;
  setSelectedBiomarkerId: (id: string) => void;
  selectedCategory: BiomarkerCategory;
  setSelectedCategory: (cat: BiomarkerCategory) => void;
  openBiomarkerDetail: (id: string) => void;
  measurementDrawerOpen: boolean;
  openMeasurementDrawer: () => void;
  closeMeasurementDrawer: () => void;
  uploadModalOpen: boolean;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  toast: string;
  showToast: (message: string) => void;
  addBioimpedanceMeasurement: (input: NewMeasurementInput) => void;
  addScaleMeasurement: (input: NewScaleMeasurementInput) => void;
  importExtractedExam: (payload: {
    fileName: string;
    fileUrl?: string;
    lab: string;
    dateLabel: string;
    isoDate: string;
    markers: ExtractedBiomarkerDraft[];
  }) => void;
  latestBio: BioimpedanceEntry;
  latestScale: ScaleMeasurement | null;
  flaggedBiomarkers: Biomarker[];
  resetDemoData: () => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<HealthState>(() => healthStorageService.load());
  const [screen, setScreenState] = useState<ScreenId>('overview');
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string>('hdl');
  const [selectedCategory, setSelectedCategory] = useState<BiomarkerCategory>('Todos');
  const [measurementDrawerOpen, setMeasurementDrawerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    healthStorageService.save(state);
  }, [state]);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const setScreen = useCallback((next: ScreenId) => {
    setScreenState(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openBiomarkerDetail = useCallback((id: string) => {
    setSelectedBiomarkerId(id);
    setSelectedCategory('Todos');
    setScreenState('labs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addBioimpedanceMeasurement = useCallback(
    (input: NewMeasurementInput) => {
      setState((prev) => {
        const history = [...prev.bioimpedanceHistory];
        const last = history[history.length - 1];
        const fatPct = input.bodyFatPct ?? last.bodyFatPct;
        const boneMassKg = input.boneMassKg ?? last.boneMassKg;
        const leanMass = input.weightKg * (1 - fatPct / 100);
        const muscleMassKg =
          input.muscleMassKg ?? Number(Math.max(20, leanMass - boneMassKg).toFixed(1));
        const muscleMassPct = Number(((muscleMassKg / input.weightKg) * 100).toFixed(2));
        const bmrKcal = Math.round(370 + 21.6 * leanMass);

        const now = new Date();
        const isoDate = input.isoDate ?? now.toISOString().slice(0, 10);
        const [yStr, mStr, dStr] = isoDate.split('-');
        const monthIdx = Math.max(0, Math.min(11, Number(mStr) - 1));
        const monthLabel = SHORT_MONTHS[monthIdx];
        const date = `${dStr} ${monthLabel} ${yStr}`;

        const newEntry: BioimpedanceEntry = {
          ...last,
          id: `bio-${isoDate}-${Date.now()}`,
          monthLabel,
          date,
          isoDate,
          weightKg: Number(input.weightKg.toFixed(1)),
          heightCm: Math.round(input.heightCm),
          bodyFatPct: Number(fatPct.toFixed(1)),
          muscleMassKg: Number(muscleMassKg.toFixed(1)),
          muscleMassPct,
          visceralFat: input.visceralFat ?? last.visceralFat,
          waterPct: input.waterPct ?? last.waterPct,
          boneMassKg: Number(boneMassKg.toFixed(1)),
          bmrKcal,
          segmental: isoDate === last.isoDate ? last.segmental : undefined,
        };

        const existingIdx = history.findIndex((item) => item.isoDate === isoDate);
        if (existingIdx >= 0) {
          history[existingIdx] = newEntry;
        } else {
          history.push(newEntry);
          history.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
        }

        return {
          ...prev,
          profile: {
            ...prev.profile,
            heightCm: Math.round(input.heightCm),
          },
          bioimpedanceHistory: history,
        };
      });
      setMeasurementDrawerOpen(false);
      showToast('Exame clínico de bioimpedância salvo');
    },
    [showToast]
  );

  const addScaleMeasurement = useCallback(
    (input: NewScaleMeasurementInput) => {
      setState((prev) => {
        const now = new Date();
        const isoDate = input.isoDate ?? now.toISOString().slice(0, 10);
        const time =
          input.time ??
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const [yStr, mStr, dStr] = isoDate.split('-');
        const monthIdx = Math.max(0, Math.min(11, Number(mStr) - 1));
        const monthLabel = SHORT_MONTHS[monthIdx];
        const heightM = input.heightCm / 100;
        const bmi = Number((input.weightKg / (heightM * heightM)).toFixed(1));
        const fatMassKg =
          input.bodyFatPct !== undefined
            ? Number(((input.weightKg * input.bodyFatPct) / 100).toFixed(1))
            : undefined;
        const muscleRatePct =
          input.muscleMassKg !== undefined
            ? Number(((input.muscleMassKg / input.weightKg) * 100).toFixed(1))
            : undefined;

        const nextRecord: ScaleMeasurement = {
          id: `scale-${isoDate}-${Date.now()}`,
          date: `${dStr}/${mStr}/${yStr}`,
          isoDate,
          time,
          monthKey: `${yStr}-${mStr}`,
          monthLabel,
          weightKg: Number(input.weightKg.toFixed(2)),
          bmi,
          bodyFatPct: input.bodyFatPct !== undefined ? Number(input.bodyFatPct.toFixed(1)) : undefined,
          fatMassKg,
          muscleMassKg:
            input.muscleMassKg !== undefined ? Number(input.muscleMassKg.toFixed(1)) : undefined,
          muscleRatePct,
          source: 'manual',
        };

        const scaleHistory = [...prev.scaleHistory, nextRecord].sort((a, b) =>
          `${a.isoDate} ${a.time}`.localeCompare(`${b.isoDate} ${b.time}`)
        );

        return {
          ...prev,
          profile: {
            ...prev.profile,
            heightCm: Math.round(input.heightCm),
          },
          scaleHistory,
        };
      });
      setMeasurementDrawerOpen(false);
      showToast('Pesagem salva no histórico da balança');
    },
    [showToast]
  );

  const importExtractedExam = useCallback(
    (payload: {
      fileName: string;
      fileUrl?: string;
      lab: string;
      dateLabel: string;
      isoDate: string;
      markers: ExtractedBiomarkerDraft[];
    }) => {
      const chosen = payload.markers.filter((m) => m.selected);
      if (chosen.length === 0) return;

      const shortDate = payload.dateLabel.split(' ').slice(1).join(' ');

      setState((prev) => {
        const nextMarkers = [...prev.biomarkers];

        for (const draft of chosen) {
          const status = computeBiomarkerStatus(draft.value, draft.lo, draft.hi);
          const idx = nextMarkers.findIndex(
            (b) =>
              (draft.biomarkerId && b.id === draft.biomarkerId) ||
              b.name.toLowerCase() === draft.name.toLowerCase()
          );

          if (idx >= 0) {
            const existing = nextMarkers[idx];
            nextMarkers[idx] = {
              ...existing,
              value: draft.value,
              status,
              history: [
                ...existing.history,
                {
                  date: shortDate || payload.dateLabel,
                  isoDate: payload.isoDate,
                  value: draft.value,
                  lab: payload.lab,
                },
              ],
            };
          } else {
            nextMarkers.unshift({
              id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: draft.name,
              category: draft.category,
              unit: draft.unit,
              value: draft.value,
              lo: draft.lo,
              hi: draft.hi,
              min: draft.min,
              max: draft.max,
              status,
              refLabel: `Ideal ${draft.lo}–${draft.hi}`,
              history: [
                {
                  date: shortDate || payload.dateLabel,
                  isoDate: payload.isoDate,
                  value: draft.value,
                  lab: payload.lab,
                },
              ],
              desc: `Biomarcador importado do laudo ${payload.fileName}.`,
            });
          }
        }

        const newExam: LabExamRecord = {
          id: `exam-${Date.now()}`,
          date: payload.dateLabel,
          isoDate: payload.isoDate,
          lab: payload.lab,
          doctor: 'Importação PDF',
          fileName: payload.fileName,
          fileUrl: payload.fileUrl,
          markerCount: chosen.length,
        };

        return {
          ...prev,
          biomarkers: nextMarkers,
          labExams: [newExam, ...prev.labExams],
        };
      });

      setUploadModalOpen(false);
      showToast(`${chosen.length} biomarcadores adicionados ao histórico`);
    },
    [showToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = healthStorageService.reset();
    setState(fresh);
    showToast('Dados originais restaurados');
  }, [showToast]);

  const latestBio = useMemo(() => {
    const sorted = [...state.bioimpedanceHistory].sort((a, b) =>
      a.isoDate.localeCompare(b.isoDate)
    );
    return sorted[sorted.length - 1];
  }, [state.bioimpedanceHistory]);

  const latestScale = useMemo(() => {
    if (!state.scaleHistory.length) return null;
    const sorted = [...state.scaleHistory].sort((a, b) =>
      `${a.isoDate} ${a.time}`.localeCompare(`${b.isoDate} ${b.time}`)
    );
    return sorted[sorted.length - 1];
  }, [state.scaleHistory]);

  const flaggedBiomarkers = useMemo(
    () =>
      state.biomarkers
        .filter((b) => b.status !== 'optimal')
        .sort((a, b) => (a.status === 'out' ? -1 : 1) - (b.status === 'out' ? -1 : 1)),
    [state.biomarkers]
  );

  const value: HealthContextValue = {
    state,
    screen,
    setScreen,
    selectedBiomarkerId,
    setSelectedBiomarkerId,
    selectedCategory,
    setSelectedCategory,
    openBiomarkerDetail,
    measurementDrawerOpen,
    openMeasurementDrawer: () => setMeasurementDrawerOpen(true),
    closeMeasurementDrawer: () => setMeasurementDrawerOpen(false),
    uploadModalOpen,
    openUploadModal: () => setUploadModalOpen(true),
    closeUploadModal: () => setUploadModalOpen(false),
    toast,
    showToast,
    addBioimpedanceMeasurement,
    addScaleMeasurement,
    importExtractedExam,
    latestBio,
    latestScale,
    flaggedBiomarkers,
    resetDemoData,
  };

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
};

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used inside HealthProvider');
  return ctx;
}
