import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useHealth } from '../../context/HealthContext';

type EntrySource = 'scale' | 'clinical';

interface DraftFields {
  isoDate: string;
  weight: string;
  height: string;
  fat: string;
  muscle: string;
  visceral: string;
  water: string;
  bone: string;
}

export const MeasurementDrawer: React.FC = () => {
  const {
    measurementDrawerOpen,
    closeMeasurementDrawer,
    latestBio,
    latestScale,
    state,
    addBioimpedanceMeasurement,
    addScaleMeasurement,
  } = useHealth();

  const [source, setSource] = useState<EntrySource>('scale');
  const [draft, setDraft] = useState<DraftFields>({
    isoDate: '',
    weight: '',
    height: '',
    fat: '',
    muscle: '',
    visceral: '',
    water: '',
    bone: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (measurementDrawerOpen) {
      const todayIso = new Date().toISOString().slice(0, 10);
      const baseWeight =
        source === 'scale' && latestScale ? latestScale.weightKg : latestBio.weightKg;
      const baseFat =
        source === 'scale'
          ? latestScale?.bodyFatPct !== undefined
            ? latestScale.bodyFatPct.toFixed(1)
            : ''
          : latestBio.bodyFatPct.toFixed(1);
      const baseMuscle =
        source === 'scale'
          ? latestScale?.muscleMassKg !== undefined
            ? latestScale.muscleMassKg.toFixed(1)
            : ''
          : latestBio.muscleMassKg.toFixed(1);

      setDraft({
        isoDate: todayIso,
        weight: baseWeight.toFixed(1),
        height: String(state.profile.heightCm),
        fat: baseFat,
        muscle: baseMuscle,
        visceral: String(latestBio.visceralFat),
        water: latestBio.waterPct.toFixed(1),
        bone: latestBio.boneMassKg.toFixed(1),
      });
      setError('');
    }
  }, [measurementDrawerOpen, source, latestBio, latestScale, state.profile.heightCm]);

  if (!measurementDrawerOpen) return null;

  const bump = (key: keyof DraftFields, step: number, decimals: number) => {
    setDraft((prev) => {
      const cur = parseFloat(prev[key]) || 0;
      const next = Math.max(0, cur + step);
      return { ...prev, [key]: next.toFixed(decimals) };
    });
    setError('');
  };

  const handleChange = (key: keyof DraftFields, raw: string) => {
    if (key === 'isoDate') {
      setDraft((prev) => ({ ...prev, isoDate: raw }));
      setError('');
      return;
    }
    const clean = raw.replace(',', '.').replace(/[^0-9.]/g, '');
    setDraft((prev) => ({ ...prev, [key]: clean }));
    setError('');
  };

  const dw = parseFloat(draft.weight);
  const dh = parseFloat(draft.height) / 100;
  const bmiPreview = dw > 0 && dh > 0 ? (dw / (dh * dh)).toFixed(1) : '—';
  const bmiCategory =
    dw > 0 && dh > 0
      ? dw / (dh * dh) < 18.5
        ? 'Abaixo do ideal'
        : dw / (dh * dh) < 25
          ? 'Faixa saudável'
          : 'Acima da faixa'
      : '';

  const handleSave = () => {
    const w = parseFloat(draft.weight);
    const h = parseFloat(draft.height);
    const f = draft.fat !== '' ? parseFloat(draft.fat) : undefined;
    const m = draft.muscle !== '' ? parseFloat(draft.muscle) : undefined;
    const v = draft.visceral !== '' ? parseFloat(draft.visceral) : undefined;
    const wa = draft.water !== '' ? parseFloat(draft.water) : undefined;
    const bo = draft.bone !== '' ? parseFloat(draft.bone) : undefined;

    if (!(w >= 30 && w <= 250)) {
      return setError('Informe um peso entre 30 e 250 kg.');
    }
    if (!(h >= 120 && h <= 230)) {
      return setError('Informe uma altura entre 120 e 230 cm.');
    }
    if (f !== undefined && !(f >= 3 && f <= 60)) {
      return setError('O percentual de gordura deve ficar entre 3% e 60%.');
    }

    if (source === 'scale') {
      addScaleMeasurement({
        weightKg: w,
        heightCm: h,
        bodyFatPct: f,
        muscleMassKg: m,
        isoDate: draft.isoDate || undefined,
      });
    } else {
      addBioimpedanceMeasurement({
        weightKg: w,
        heightCm: h,
        bodyFatPct: f,
        muscleMassKg: m,
        visceralFat: v,
        waterPct: wa,
        boneMassKg: bo,
        isoDate: draft.isoDate || undefined,
      });
    }
  };

  const primaryFields: {
    key: keyof DraftFields;
    label: string;
    unit: string;
    step: number;
    decimals: number;
    placeholder: string;
  }[] = [
    { key: 'weight', label: 'Peso atual', unit: 'kg', step: 0.1, decimals: 1, placeholder: '91.0' },
    { key: 'height', label: 'Altura', unit: 'cm', step: 1, decimals: 0, placeholder: '187' },
    {
      key: 'fat',
      label:
        source === 'scale'
          ? 'Gordura corporal estimada (opcional)'
          : 'Gordura corporal (exame clínico)',
      unit: '%',
      step: 0.1,
      decimals: 1,
      placeholder: source === 'scale' ? '25.5' : '17.5',
    },
  ];

  const clinicalAdvancedFields: {
    key: keyof DraftFields;
    label: string;
    unit: string;
    step: number;
    decimals: number;
    placeholder: string;
  }[] = [
    { key: 'muscle', label: 'Massa muscular', unit: 'kg', step: 0.1, decimals: 1, placeholder: '74.4' },
    { key: 'visceral', label: 'Gordura visceral', unit: 'lvl', step: 1, decimals: 0, placeholder: '6' },
    { key: 'water', label: 'Água corporal', unit: '%', step: 0.1, decimals: 1, placeholder: '58.4' },
    { key: 'bone', label: 'Massa óssea', unit: 'kg', step: 0.1, decimals: 1, placeholder: '3.8' },
  ];

  const scaleAdvancedFields: {
    key: keyof DraftFields;
    label: string;
    unit: string;
    step: number;
    decimals: number;
    placeholder: string;
  }[] = [
    {
      key: 'muscle',
      label: 'Massa muscular estimada (opcional)',
      unit: 'kg',
      step: 0.1,
      decimals: 1,
      placeholder: '64.1',
    },
  ];

  const advancedFields = source === 'clinical' ? clinicalAdvancedFields : scaleAdvancedFields;

  const renderField = (fd: (typeof primaryFields)[number]) => (
    <div key={fd.key} className="flex flex-col gap-2">
      <label className="text-[13px] font-semibold text-ink-secondary">{fd.label}</label>
      <div className="flex items-center gap-2 bg-canvas-card rounded-[16px] p-[6px]">
        <button
          type="button"
          onClick={() => bump(fd.key, -fd.step, fd.decimals)}
          className="w-11 h-11 rounded-[12px] bg-canvas hover:bg-canvas-subtle text-ink text-[20px] flex items-center justify-center cursor-pointer transition-colors"
          aria-label={`Diminuir ${fd.label}`}
        >
          −
        </button>
        <input
          value={draft[fd.key]}
          onChange={(e) => handleChange(fd.key, e.target.value)}
          inputMode="decimal"
          placeholder={fd.placeholder}
          className="flex-1 min-w-0 border-none bg-transparent text-center text-[22px] font-semibold text-ink tabular-nums focus:outline-none"
        />
        <span className="text-[13px] text-ink-muted w-8 text-center">{fd.unit}</span>
        <button
          type="button"
          onClick={() => bump(fd.key, fd.step, fd.decimals)}
          className="w-11 h-11 rounded-[12px] bg-canvas hover:bg-canvas-subtle text-ink text-[20px] flex items-center justify-center cursor-pointer transition-colors"
          aria-label={`Aumentar ${fd.label}`}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div
      onClick={closeMeasurementDrawer}
      className="fixed inset-0 z-40 bg-ink/30 flex items-end wide:items-center justify-center p-0 wide:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-canvas rounded-t-[24px] wide:rounded-[24px] px-[22px] pt-3 pb-7 flex flex-col gap-5"
      >
        <div className="w-10 h-1 rounded-full bg-canvas-divider mx-auto wide:hidden" />

        <div className="flex items-center justify-between">
          <h2 className="m-0 text-[20px] font-semibold tracking-[-0.015em] text-ink">
            Registrar medições
          </h2>
          <button
            type="button"
            onClick={closeMeasurementDrawer}
            aria-label="Fechar"
            className="w-9 h-9 rounded-[12px] bg-canvas-card hover:bg-canvas-hover text-ink flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Source Switcher: Personal Scale vs Clinical Exam */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1 p-1 bg-canvas-card rounded-[14px]">
            <button
              type="button"
              onClick={() => setSource('scale')}
              className={`rounded-[11px] py-2 px-3 text-[13px] font-semibold transition-colors cursor-pointer ${
                source === 'scale'
                  ? 'bg-sage text-ink'
                  : 'bg-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              Balança pessoal
            </button>
            <button
              type="button"
              onClick={() => setSource('clinical')}
              className={`rounded-[11px] py-2 px-3 text-[13px] font-semibold transition-colors cursor-pointer ${
                source === 'clinical'
                  ? 'bg-sage text-ink'
                  : 'bg-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              Exame nutricionista
            </button>
          </div>
          <span className="text-[12px] text-ink-muted leading-snug">
            {source === 'scale'
              ? 'Adiciona uma nova pesagem ao histórico OKOK sem alterar seu exame clínico de referência.'
              : 'Registra uma nova bioimpedância clínica (atualiza a silhueta e a composição corporal).'}
          </span>
        </div>

        {/* Date Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-ink-secondary">Data da medição</label>
          <input
            type="date"
            value={draft.isoDate}
            onChange={(e) => handleChange('isoDate', e.target.value)}
            className="h-11 rounded-[14px] bg-canvas-card px-3.5 text-[14px] font-medium text-ink tabular-nums focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-4">{primaryFields.map(renderField)}</div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="self-start text-[13px] font-semibold text-ink-sageStrong hover:text-ink cursor-pointer"
        >
          {showAdvanced
            ? 'Ocultar campos opcionais'
            : source === 'clinical'
              ? '+ Editar massa muscular, visceral, água e massa óssea'
              : '+ Adicionar massa muscular estimada'}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-4 pt-1 border-t border-canvas-divider">
            {advancedFields.map(renderField)}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-[14px] rounded-[16px] bg-sage-soft tabular-nums">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-ink-sage">Prévia do IMC</span>
            {bmiCategory && (
              <span className="text-[11px] text-ink-muted">{bmiCategory}</span>
            )}
          </div>
          <span className="text-[17px] font-semibold text-ink">{bmiPreview}</span>
        </div>

        {error && <span className="text-[13px] text-terracotta-ink font-medium">{error}</span>}

        <button
          type="button"
          onClick={handleSave}
          className="h-[52px] rounded-[16px] bg-ink hover:bg-ink-hover text-canvas text-[15px] font-semibold cursor-pointer transition-colors"
        >
          {source === 'scale' ? 'Salvar pesagem no histórico' : 'Salvar exame clínico'}
        </button>
      </div>
    </div>
  );
};
