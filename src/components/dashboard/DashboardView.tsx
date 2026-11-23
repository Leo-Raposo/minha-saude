import React, { useMemo } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { useHealth } from '../../context/HealthContext';
import { getStatusPillLabel, STATUS_TOKENS } from '../../data/mockHealthData';

function formatSignedDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '−';
  return `${sign}${Math.abs(delta).toFixed(1)}`;
}

function formatTodayPtBr(): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export const DashboardView: React.FC = () => {
  const {
    state,
    latestBio,
    latestScale,
    flaggedBiomarkers,
    openBiomarkerDetail,
    openMeasurementDrawer,
    openUploadModal,
    setScreen,
  } = useHealth();

  const { profile, bioimpedanceHistory, scaleHistory, labExams } = state;
  const latestExam = labExams[0];

  const sortedScale = useMemo(
    () =>
      [...scaleHistory].sort((a, b) =>
        `${a.isoDate} ${a.time}`.localeCompare(`${b.isoDate} ${b.time}`)
      ),
    [scaleHistory]
  );

  const sortedClinical = useMemo(
    () => [...bioimpedanceHistory].sort((a, b) => a.isoDate.localeCompare(b.isoDate)),
    [bioimpedanceHistory]
  );

  // Use the most recent weight across personal scale and clinical bioimpedance
  const useScaleForCurrentWeight =
    latestScale !== null && latestScale.isoDate >= latestBio.isoDate;
  const currentWeightKg = useScaleForCurrentWeight ? latestScale.weightKg : latestBio.weightKg;
  const lastWeightDateLabel = useScaleForCurrentWeight ? latestScale.date : latestBio.date;

  const heightM = profile.heightCm / 100;
  const bmi = currentWeightKg / (heightM * heightM);
  const bmiLabel =
    bmi < 18.5 ? 'abaixo do ideal' : bmi < 25 ? 'saudável' : 'acima da faixa';

  // Weight sparkline & delta from real scale history
  const weightSeries = useMemo(() => {
    if (sortedScale.length >= 2) {
      const byDay = new Map<string, number>();
      for (const s of sortedScale) byDay.set(s.isoDate, s.weightKg);
      return Array.from(byDay.values()).map((v, i) => ({ i, v }));
    }
    return sortedClinical.length >= 2
      ? sortedClinical.map((b, i) => ({ i, v: b.weightKg }))
      : null;
  }, [sortedScale, sortedClinical]);

  const weightNote = useMemo(() => {
    if (sortedScale.length >= 2) {
      const first = sortedScale[0];
      const delta = currentWeightKg - first.weightKg;
      return `${formatSignedDelta(delta)} kg desde ${first.monthLabel} · OKOK`;
    }
    return `Exame em ${latestBio.date}`;
  }, [sortedScale, currentWeightKg, latestBio.date]);

  const hasClinicalTrend = sortedClinical.length >= 2;
  const firstClinical = sortedClinical[0];

  const fatNote = hasClinicalTrend
    ? `${formatSignedDelta(latestBio.bodyFatPct - firstClinical.bodyFatPct)} pts desde ${firstClinical.monthLabel}`
    : `INEN BC601-FS · ${latestBio.date.slice(0, 6)}`;

  const muscleNote = hasClinicalTrend
    ? `${formatSignedDelta(latestBio.muscleMassKg - firstClinical.muscleMassKg)} kg desde ${firstClinical.monthLabel}`
    : `${latestBio.muscleMassPct.toFixed(1)}% do peso · clínico`;

  const fatSeries = hasClinicalTrend
    ? sortedClinical.map((b, i) => ({ i, v: b.bodyFatPct }))
    : null;
  const muscleSeries = hasClinicalTrend
    ? sortedClinical.map((b, i) => ({ i, v: b.muscleMassKg }))
    : null;

  const metricCards = [
    {
      label: 'Peso atual',
      value: currentWeightKg.toFixed(1),
      unit: 'kg',
      note: weightNote,
      series: weightSeries,
    },
    {
      label: 'Altura · IMC',
      value: String(profile.heightCm),
      unit: 'cm',
      note: `IMC ${bmi.toFixed(1)} · ${bmiLabel}`,
      series: null,
    },
    {
      label: '% Gordura',
      value: latestBio.bodyFatPct.toFixed(1),
      unit: '%',
      note: fatNote,
      series: fatSeries,
    },
    {
      label: 'Massa muscular',
      value: latestBio.muscleMassKg.toFixed(1),
      unit: 'kg',
      note: muscleNote,
      series: muscleSeries,
    },
  ];

  const todayLabel = useMemo(() => formatTodayPtBr(), []);

  return (
    <div className="flex flex-col gap-7">
      {/* Greeting header */}
      <header className="flex flex-col gap-2">
        <span className="text-[13px] text-ink-muted font-medium">{todayLabel}</span>
        <h1 className="m-0 text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.025em] leading-[1.15] text-ink">
          Bom dia, {profile.firstName}
        </h1>
        <p className="m-0 text-[15px] leading-[1.5] text-ink-muted max-w-[540px]">
          Seu último exame de sangue chegou em {latestExam?.date ?? '07 Nov 2026'} ({latestExam?.lab}).{' '}
          <span className="tabular-nums font-medium text-ink-secondary">
            {flaggedBiomarkers.length}
          </span>{' '}
          biomarcadores merecem atenção.
        </p>
      </header>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={openUploadModal}
          className="flex items-center gap-[14px] px-[18px] py-4 rounded-card bg-sage hover:bg-sage-hover text-ink text-left transition-colors cursor-pointer"
        >
          <div className="w-11 h-11 flex-none rounded-[14px] bg-sage-well flex items-center justify-center text-ink">
            <Upload className="w-[21px] h-[21px]" strokeWidth={1.7} />
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="text-[15px] font-semibold">Subir PDF de exame</span>
            <span className="text-[13px] text-ink-sage">Laudo de qualquer laboratório</span>
          </div>
        </button>

        <button
          type="button"
          onClick={openMeasurementDrawer}
          className="flex items-center gap-[14px] px-[18px] py-4 rounded-card bg-canvas-card hover:bg-canvas-hover text-ink text-left transition-colors cursor-pointer"
        >
          <div className="w-11 h-11 flex-none rounded-[14px] bg-canvas flex items-center justify-center text-ink">
            <Plus className="w-[21px] h-[21px]" strokeWidth={1.7} />
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="text-[15px] font-semibold">Registrar peso e altura</span>
            <span className="text-[13px] text-ink-muted tabular-nums">
              Último registro em {lastWeightDateLabel}
            </span>
          </div>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metricCards.map((m) => (
          <div
            key={m.label}
            className="bg-canvas-card rounded-card px-[18px] pt-[18px] pb-4 flex flex-col gap-[14px] min-h-[150px]"
          >
            <span className="text-[13px] text-ink-muted font-medium">{m.label}</span>
            <div className="flex items-baseline gap-1 tabular-nums">
              <span className="text-[32px] font-semibold tracking-[-0.03em] leading-none text-ink">
                {m.value}
              </span>
              <span className="text-[14px] text-ink-muted font-medium">{m.unit}</span>
            </div>
            <div className="mt-auto flex items-end justify-between gap-2">
              <span className="text-[12px] text-ink-sageStrong font-medium tabular-nums leading-snug">
                {m.note}
              </span>
              {m.series && (
                <div className="w-16 h-6 flex-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={m.series}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#99AA84"
                        strokeWidth={1.8}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Priority Health Attention & Risks Section */}
      <section className="bg-canvas-card rounded-card p-[clamp(18px,3vw,28px)] flex flex-col gap-[18px]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 text-[19px] font-semibold tracking-[-0.015em] text-ink">
              Atenção e riscos de saúde
            </h2>
            <span className="text-[13px] text-ink-muted">
              Biomarcadores fora ou no limite da faixa ideal nos seus últimos exames
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScreen('labs')}
            className="bg-canvas hover:bg-sage-soft text-ink rounded-full px-[14px] py-2 text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Todos os exames
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
          {flaggedBiomarkers.map((marker) => {
            const st = STATUS_TOKENS[marker.status];
            const pillLabel = getStatusPillLabel(marker);
            return (
              <button
                key={marker.id}
                type="button"
                onClick={() => openBiomarkerDetail(marker.id)}
                className="flex flex-col gap-3 px-[18px] py-4 rounded-[16px] bg-canvas hover:bg-canvas-subtle text-ink text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2.5 w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      style={{ backgroundColor: st.dot }}
                      className="w-2 h-2 flex-none rounded-full"
                    />
                    <span className="text-[15px] font-semibold truncate">{marker.name}</span>
                  </div>
                  <span
                    style={{ backgroundColor: st.bg, color: st.fg }}
                    className="flex-none text-[12px] font-semibold px-[10px] py-1 rounded-full"
                  >
                    {pillLabel}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-[22px] font-semibold tracking-[-0.02em]">
                    {marker.value}
                  </span>
                  <span className="text-[13px] text-ink-muted">
                    {marker.unit} · {marker.refLabel ?? `ideal ${marker.lo}–${marker.hi}`}
                  </span>
                </div>

                {marker.tip && (
                  <p className="m-0 text-[13px] leading-[1.55] text-ink-secondary">
                    {marker.tip}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-[12px] text-ink-muted">
          As orientações são informativas e não substituem avaliação médica. Discuta seus resultados com seu médico.
        </span>
      </section>
    </div>
  );
};
