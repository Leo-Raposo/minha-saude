import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHealth } from '../../context/HealthContext';
import { HumanBodyInteractive } from './HumanBodyInteractive';
import { ScaleHistorySection } from './ScaleHistorySection';

type ProgMetric = 'weight' | 'bmi' | 'fat';
type CompSource = 'clinical' | 'scale';

const PROG_META: Record<ProgMetric, { label: string; unit: string }> = {
  weight: { label: 'Peso', unit: 'kg' },
  bmi: { label: 'IMC', unit: 'pts' },
  fat: { label: 'Gordura (est.)', unit: '%' },
};

const COMP_META: Record<CompSource, { label: string }> = {
  scale: { label: 'Balança pessoal' },
  clinical: { label: 'Nutricionista' },
};

export const BioimpedanceView: React.FC = () => {
  const { state, latestBio, openMeasurementDrawer } = useHealth();
  const [progMetric, setProgMetric] = useState<ProgMetric>('weight');
  const [compSource, setCompSource] = useState<CompSource>('scale');

  const clinicalHistory = useMemo(
    () => [...state.bioimpedanceHistory].sort((a, b) => a.isoDate.localeCompare(b.isoDate)),
    [state.bioimpedanceHistory]
  );

  const latestScaleWithComp = useMemo(() => {
    const sorted = [...state.scaleHistory].sort((a, b) =>
      `${a.isoDate} ${a.time}`.localeCompare(`${b.isoDate} ${b.time}`)
    );
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].bodyFatPct !== undefined && sorted[i].muscleMassKg !== undefined) {
        return sorted[i];
      }
    }
    return null;
  }, [state.scaleHistory]);

  const muscleDeltaLabel = useMemo(() => {
    if (clinicalHistory.length >= 2) {
      const firstClinical = clinicalHistory[0];
      const dMuscle = latestBio.muscleMassKg - firstClinical.muscleMassKg;
      return `${dMuscle >= 0 ? '+' : '−'}${Math.abs(dMuscle).toFixed(1)} kg desde ${firstClinical.monthLabel}`;
    }
    return `${latestBio.muscleMassPct.toFixed(1)}% do peso`;
  }, [clinicalHistory, latestBio]);

  // Donut composition segments (switchable between clinical exam and personal scale)
  const isScaleComp = compSource === 'scale' && latestScaleWithComp !== null;
  const totalKg = isScaleComp ? latestScaleWithComp.weightKg : latestBio.weightKg;
  const compDateLabel = isScaleComp ? latestScaleWithComp.date : latestBio.date;

  const rawSegments = useMemo(() => {
    if (isScaleComp && latestScaleWithComp) {
      const fatKg =
        latestScaleWithComp.fatMassKg ??
        Number(((latestScaleWithComp.weightKg * (latestScaleWithComp.bodyFatPct ?? 0)) / 100).toFixed(1));
      const muscleKg = latestScaleWithComp.muscleMassKg ?? 0;
      const otherKg = Number(Math.max(0, latestScaleWithComp.weightKg - fatKg - muscleKg).toFixed(1));
      return [
        { name: 'Massa muscular (est.)', kg: muscleKg, color: '#99AA84' },
        { name: 'Massa adiposa (est.)', kg: fatKg, color: '#D6CDB8' },
        ...(otherKg >= 0.2 ? [{ name: 'Massa óssea / outros', kg: otherKg, color: '#6F7A63' }] : []),
      ];
    }

    const fatKg = Number(((latestBio.weightKg * latestBio.bodyFatPct) / 100).toFixed(1));
    const muscleKg = latestBio.muscleMassKg;
    const boneKg = latestBio.boneMassKg;
    const otherKg = Number(Math.max(0, latestBio.weightKg - fatKg - muscleKg - boneKg).toFixed(1));
    return [
      { name: 'Massa muscular (incl. água)', kg: muscleKg, color: '#99AA84' },
      { name: 'Massa adiposa', kg: fatKg, color: '#D6CDB8' },
      ...(otherKg >= 0.2 ? [{ name: 'Outros tecidos', kg: otherKg, color: '#C7D0B9' }] : []),
      { name: 'Massa óssea', kg: boneKg, color: '#6F7A63' },
    ];
  }, [isScaleComp, latestScaleWithComp, latestBio]);

  const segmentSumKg = rawSegments.reduce((acc, s) => acc + s.kg, 0) || totalKg;
  const donutData = rawSegments.map((item) => ({
    ...item,
    pct: ((item.kg / segmentSumKg) * 100).toFixed(1),
  }));

  // Monthly progression series dynamically grouped from real personal scale history
  const monthlyScalePoints = useMemo(() => {
    const sorted = [...state.scaleHistory].sort((a, b) =>
      `${a.isoDate} ${a.time}`.localeCompare(`${b.isoDate} ${b.time}`)
    );
    const byMonth = new Map<string, (typeof sorted)[number]>();
    for (const item of sorted) {
      // Keep the latest valid reading for the selected metric in each month
      if (progMetric === 'fat' && item.bodyFatPct === undefined) continue;
      byMonth.set(item.monthKey, item);
    }
    return Array.from(byMonth.values());
  }, [state.scaleHistory, progMetric]);

  const barData = monthlyScalePoints.map((entry, idx) => {
    const val =
      progMetric === 'weight'
        ? entry.weightKg
        : progMetric === 'bmi'
          ? entry.bmi
          : (entry.bodyFatPct ?? 0);
    return {
      month: entry.monthLabel,
      date: entry.date,
      value: val,
      isLatest: idx === monthlyScalePoints.length - 1,
    };
  });

  const progDelta =
    barData.length >= 2 ? barData[barData.length - 1].value - barData[0].value : 0;
  const progSummary =
    barData.length >= 2
      ? `${progDelta >= 0 ? '+' : '−'}${Math.abs(progDelta).toFixed(1)} ${
          PROG_META[progMetric].unit
        } desde ${barData[0].month} · Balança OKOK`
      : 'Balança OKOK';

  const vals = barData.map((d) => d.value);
  const minVal = vals.length ? Math.min(...vals) : 0;
  const maxVal = vals.length ? Math.max(...vals) : 100;
  const yPad = Math.max((maxVal - minVal) * 0.22, 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.025em] leading-[1.15] text-ink">
            Bioimpedância
          </h1>
          <span className="text-[13px] text-ink-muted tabular-nums">
            Exame clínico INEN BC601-FS (Nutricionista) · {latestBio.date} ·{' '}
            {latestBio.weightKg.toFixed(1)} kg
          </span>
        </div>

        <button
          type="button"
          onClick={openMeasurementDrawer}
          className="inline-flex items-center gap-2 rounded-full px-[18px] py-[11px] bg-sage hover:bg-sage-hover text-ink text-[14px] font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-[18px] h-[18px]" strokeWidth={1.9} />
          Atualizar medições
        </button>
      </header>

      {/* Interactive Human Body SVG + Callouts */}
      <HumanBodyInteractive entry={latestBio} muscleDeltaLabel={muscleDeltaLabel} />

      {/* Bottom 2-Column Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart: Composition */}
        <section className="bg-canvas-card rounded-card p-[clamp(18px,3vw,26px)] flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.015em] text-ink">
                Composição corporal
              </h2>
              <span className="text-[13px] text-ink-muted tabular-nums">
                {isScaleComp
                  ? `Estimativa OKOK (${compDateLabel})`
                  : `Exame INEN BC601-FS (${compDateLabel})`}
              </span>
            </div>

            <div className="flex gap-0.5 p-[3px] bg-canvas rounded-full">
              {(Object.keys(COMP_META) as CompSource[]).map((k) => {
                const active = compSource === k;
                const disabled = k === 'scale' && !latestScaleWithComp;
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={disabled}
                    onClick={() => setCompSource(k)}
                    className={`rounded-full px-3 py-[7px] text-[12px] font-semibold transition-colors ${
                      disabled
                        ? 'opacity-40 cursor-not-allowed text-ink-muted'
                        : active
                          ? 'bg-sage text-ink cursor-pointer'
                          : 'bg-transparent text-ink cursor-pointer'
                    }`}
                  >
                    {COMP_META[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative w-[176px] h-[176px] flex-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="kg"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={76}
                    paddingAngle={2}
                    stroke="#ECEAE2"
                    strokeWidth={2}
                  >
                    {donutData.map((seg) => (
                      <Cell key={seg.name} fill={seg.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as (typeof donutData)[number];
                      return (
                        <div className="bg-ink text-canvas px-3 py-1.5 rounded-[10px] text-[12px] tabular-nums">
                          <span className="font-semibold">{d.name}:</span> {d.kg.toFixed(1)} kg (
                          {d.pct}%)
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 tabular-nums">
                <span className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
                  {totalKg.toFixed(1)}
                </span>
                <span className="text-[12px] text-ink-muted">
                  {isScaleComp ? 'kg balança' : 'kg exame'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[210px] flex flex-col gap-3">
              {donutData.map((sg) => (
                <div
                  key={sg.name}
                  className="flex items-center gap-2.5 text-[13px] tabular-nums"
                >
                  <span
                    style={{ backgroundColor: sg.color }}
                    className="w-2.5 h-2.5 rounded-[3px] flex-none"
                  />
                  <span className="flex-1 font-medium text-ink">{sg.name}</span>
                  <span className="text-ink-muted whitespace-nowrap">
                    {sg.kg.toFixed(1)} kg
                  </span>
                  <span className="w-12 text-right font-semibold text-ink whitespace-nowrap">
                    {sg.pct}%
                  </span>
                </div>
              ))}
              {isScaleComp && (
                <span className="text-[11px] text-sand-ink bg-sand-pill rounded-[10px] px-2.5 py-1.5 leading-snug">
                  Estimativa residencial (OKOK) — menos precisa que o exame clínico.
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Monthly Progression Bar Chart (Real Scale History) */}
        <section className="bg-canvas-card rounded-card p-[clamp(18px,3vw,26px)] flex flex-col gap-5">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.015em] text-ink">
                Evolução mensal
              </h2>
              <span className="text-[13px] text-ink-muted tabular-nums">
                {progSummary}
              </span>
            </div>

            <div className="flex gap-0.5 p-[3px] bg-canvas rounded-full">
              {(Object.keys(PROG_META) as ProgMetric[]).map((k) => {
                const active = progMetric === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setProgMetric(k)}
                    className={`rounded-full px-3 py-[7px] text-[12px] font-semibold cursor-pointer transition-colors ${
                      active ? 'bg-sage text-ink' : 'bg-transparent text-ink'
                    }`}
                  >
                    {PROG_META[k].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 14, right: 6, left: -18, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#5F6459', fontSize: 12 }}
                />
                <YAxis
                  domain={[
                    Math.max(0, Number((minVal - yPad).toFixed(1))),
                    Number((maxVal + yPad * 0.4).toFixed(1)),
                  ]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#5F6459', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: '#E4E1D7', radius: 10 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as (typeof barData)[number];
                    return (
                      <div className="bg-ink text-canvas px-3 py-1.5 rounded-[10px] text-[12px] tabular-nums">
                        <div className="font-semibold">
                          {item.value.toFixed(1)} {PROG_META[progMetric].unit}
                        </div>
                        <div className="text-sage-soft text-[11px]">{item.date}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[10, 10, 6, 6]} maxBarSize={36}>
                  {barData.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={entry.isLatest ? '#99AA84' : '#CBD3BF'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Personal Scale History (OKOK International) */}
      <ScaleHistorySection records={state.scaleHistory} clinicalEntry={latestBio} />
    </div>
  );
};
