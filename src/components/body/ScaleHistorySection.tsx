import React, { useMemo, useState } from 'react';
import { Info, Scale, TrendingDown } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BioimpedanceEntry, ScaleMeasurement } from '../../types/health';

type ScaleChartMetric = 'weight' | 'bmi' | 'fat' | 'muscle';

const METRIC_META: Record<
  ScaleChartMetric,
  { label: string; unit: string; isEstimate: boolean }
> = {
  weight: { label: 'Peso', unit: 'kg', isEstimate: false },
  bmi: { label: 'IMC', unit: '', isEstimate: false },
  fat: { label: 'Gordura % (est.)', unit: '%', isEstimate: true },
  muscle: { label: 'Massa musc. (est.)', unit: 'kg', isEstimate: true },
};

interface ScaleHistorySectionProps {
  records: ScaleMeasurement[];
  clinicalEntry: BioimpedanceEntry;
}

function formatPtNumber(val: number, decimals = 1): string {
  return val.toFixed(decimals).replace('.', ',');
}

function formatShortDate(dateStr: string): string {
  // '20/11/2026' -> '20/11'
  return dateStr.slice(0, 5);
}

export const ScaleHistorySection: React.FC<ScaleHistorySectionProps> = ({
  records,
  clinicalEntry,
}) => {
  const [chartMetric, setChartMetric] = useState<ScaleChartMetric>('weight');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');

  const sortedAsc = useMemo(
    () =>
      [...records].sort((a, b) =>
        `${a.isoDate} ${a.time}`.localeCompare(`${b.isoDate} ${b.time}`)
      ),
    [records]
  );

  const sortedDesc = useMemo(() => [...sortedAsc].reverse(), [sortedAsc]);

  const monthOptions = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; count: number }>();
    for (const r of sortedDesc) {
      const existing = seen.get(r.monthKey);
      if (existing) {
        existing.count += 1;
      } else {
        seen.set(r.monthKey, {
          key: r.monthKey,
          label: `${r.monthLabel}/${r.isoDate.slice(2, 4)}`,
          count: 1,
        });
      }
    }
    return Array.from(seen.values());
  }, [sortedDesc]);

  if (sortedAsc.length === 0) return null;

  const first = sortedAsc[0];
  const latest = sortedAsc[sortedAsc.length - 1];
  const weightDelta = latest.weightKg - first.weightKg;
  const bmiDelta = latest.bmi - first.bmi;

  const daysSpan = Math.max(
    1,
    Math.round(
      (new Date(latest.isoDate).getTime() - new Date(first.isoDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  // Deduplicate same-day weigh-ins for a cleaner trend line (keeping the last reading of each day)
  const chartData = useMemo(() => {
    const byDate = new Map<string, ScaleMeasurement>();
    for (const r of sortedAsc) {
      byDate.set(r.isoDate, r);
    }
    return Array.from(byDate.values())
      .map((r) => {
        const value =
          chartMetric === 'weight'
            ? r.weightKg
            : chartMetric === 'bmi'
              ? r.bmi
              : chartMetric === 'fat'
                ? r.bodyFatPct
                : r.muscleMassKg;
        return {
          ...r,
          shortDate: formatShortDate(r.date),
          value,
        };
      })
      .filter((d): d is typeof d & { value: number } => typeof d.value === 'number');
  }, [sortedAsc, chartMetric]);

  const vals = chartData.map((d) => d.value);
  const minVal = vals.length ? Math.min(...vals) : 0;
  const maxVal = vals.length ? Math.max(...vals) : 100;
  const yPad = Math.max((maxVal - minVal) * 0.14, 0.8);

  const filteredDesc = useMemo(() => {
    if (selectedMonth === 'Todos') return sortedDesc;
    return sortedDesc.filter((r) => r.monthKey === selectedMonth);
  }, [sortedDesc, selectedMonth]);

  // Compute delta vs previous chronological measurement for each record id
  const deltaById = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 1; i < sortedAsc.length; i++) {
      map.set(sortedAsc[i].id, sortedAsc[i].weightKg - sortedAsc[i - 1].weightKg);
    }
    return map;
  }, [sortedAsc]);

  const meta = METRIC_META[chartMetric];

  return (
    <section className="bg-canvas-card rounded-card p-[clamp(18px,3vw,28px)] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="m-0 text-[19px] font-semibold tracking-[-0.015em] text-ink">
              Histórico da balança pessoal
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-canvas text-ink-secondary">
              <Scale className="w-3.5 h-3.5 text-sage-deep" strokeWidth={1.8} />
              OKOK International
            </span>
          </div>
          <span className="text-[13px] text-ink-muted tabular-nums">
            {first.date} – {latest.date} ({daysSpan} dias) · {sortedAsc.length} pesagens registradas
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1.5 text-[12px] font-semibold text-ink-optimal tabular-nums">
          <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
          {weightDelta <= 0 ? '−' : '+'}
          {formatPtNumber(Math.abs(weightDelta), 2)} kg no período
        </div>
      </div>

      {/* Accuracy Disclaimer Banner */}
      <div className="flex items-start gap-3 rounded-[16px] bg-sand-pill px-4 py-3 text-sand-ink">
        <Info className="w-[18px] h-[18px] flex-none mt-0.5" strokeWidth={1.9} />
        <p className="m-0 text-[13px] leading-[1.5]">
          <strong className="font-semibold">Precisão de balança residencial:</strong> Os valores de{' '}
          <strong className="font-semibold">peso e IMC</strong> refletem fielmente sua evolução
          diária. Já os percentuais de gordura e massa muscular são estimativas menos precisas que
          o exame clínico com nutricionista (INEN BC601-FS:{' '}
          <span className="tabular-nums font-semibold">
            {formatPtNumber(clinicalEntry.bodyFatPct, 1)}% gordura ·{' '}
            {formatPtNumber(clinicalEntry.muscleMassKg, 1)} kg massa magra
          </span>
          ) e servem apenas como referência de tendência.
        </p>
      </div>

      {/* 3 Summary KPI Mini-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-canvas rounded-[16px] px-4 py-3.5 flex flex-col gap-1 tabular-nums">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
            Última pesagem (OKOK)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
              {formatPtNumber(latest.weightKg, 1)}
            </span>
            <span className="text-[13px] text-ink-muted font-medium">kg</span>
          </div>
          <span className="text-[12px] text-ink-sageStrong font-medium">
            {latest.date} às {latest.time}
          </span>
        </div>

        <div className="bg-canvas rounded-[16px] px-4 py-3.5 flex flex-col gap-1 tabular-nums">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
            Variação de peso
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-semibold tracking-[-0.02em] text-ink-optimal">
              {weightDelta <= 0 ? '−' : '+'}
              {formatPtNumber(Math.abs(weightDelta), 2)}
            </span>
            <span className="text-[13px] text-ink-muted font-medium">kg</span>
          </div>
          <span className="text-[12px] text-ink-muted">
            {formatPtNumber(first.weightKg, 1)} kg → {formatPtNumber(latest.weightKg, 1)} kg
          </span>
        </div>

        <div className="bg-canvas rounded-[16px] px-4 py-3.5 flex flex-col gap-1 tabular-nums">
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted">
            Variação do IMC
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-semibold tracking-[-0.02em] text-ink-optimal">
              {bmiDelta <= 0 ? '−' : '+'}
              {formatPtNumber(Math.abs(bmiDelta), 1)}
            </span>
            <span className="text-[13px] text-ink-muted font-medium">pts</span>
          </div>
          <span className="text-[12px] text-ink-muted">
            {formatPtNumber(first.bmi, 1)} → {formatPtNumber(latest.bmi, 1)}
          </span>
        </div>
      </div>

      {/* Trend Area Chart */}
      <div className="bg-canvas rounded-[16px] p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-ink">
              Curva de evolução · {meta.label}
            </span>
            <span className="text-[12px] text-ink-muted">
              {meta.isEstimate
                ? 'Estimativa da balança OKOK — usar apenas para observar tendência'
                : 'Medição direta na balança OKOK (1 registro por dia)'}
            </span>
          </div>

          <div className="flex gap-0.5 p-[3px] bg-canvas-card rounded-full flex-wrap">
            {(Object.keys(METRIC_META) as ScaleChartMetric[]).map((k) => {
              const active = chartMetric === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChartMetric(k)}
                  className={`rounded-full px-3 py-[6px] text-[12px] font-semibold cursor-pointer transition-colors ${
                    active ? 'bg-sage text-ink' : 'bg-transparent text-ink-secondary hover:text-ink'
                  }`}
                >
                  {METRIC_META[k].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scaleTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#99AA84" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#99AA84" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#D6D3C8" strokeDasharray="3 4" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="shortDate"
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                tick={{ fill: '#5F6459', fontSize: 11 }}
              />
              <YAxis
                domain={[
                  Number(Math.max(0, minVal - yPad).toFixed(1)),
                  Number((maxVal + yPad).toFixed(1)),
                ]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#5F6459', fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as ScaleMeasurement & { value: number };
                  return (
                    <div className="bg-ink text-canvas px-3.5 py-2.5 rounded-[12px] text-[12px] tabular-nums flex flex-col gap-1">
                      <div className="font-semibold text-[13px]">
                        {formatPtNumber(item.value, chartMetric === 'weight' ? 2 : 1)}
                        {meta.unit ? ` ${meta.unit}` : ''}
                      </div>
                      <div className="text-sage-soft text-[11px]">
                        {item.date} · {item.time}
                      </div>
                      <div className="text-canvas-divider text-[11px] pt-0.5 border-t border-ink-secondary">
                        Peso {formatPtNumber(item.weightKg, 2)} kg · IMC {formatPtNumber(item.bmi, 1)}
                        {item.bodyFatPct !== undefined &&
                          ` · Gord. ${formatPtNumber(item.bodyFatPct, 1)}% (est.)`}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#7E8F6A"
                strokeWidth={2.2}
                fill="url(#scaleTrendGradient)"
                dot={{ r: 2.8, fill: '#4F6340', stroke: '#F6F5F0', strokeWidth: 1.2 }}
                activeDot={{ r: 5, fill: '#4F6340', stroke: '#DCE3D2', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month Filter Pills + Full Weigh-in Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-ink">
            Registros detalhados ({filteredDesc.length})
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedMonth('Todos')}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold cursor-pointer transition-colors ${
                selectedMonth === 'Todos'
                  ? 'bg-ink text-canvas'
                  : 'bg-canvas text-ink-secondary hover:bg-canvas-hover'
              }`}
            >
              Todos
            </button>
            {monthOptions.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold cursor-pointer transition-colors tabular-nums ${
                  selectedMonth === m.key
                    ? 'bg-ink text-canvas'
                    : 'bg-canvas text-ink-secondary hover:bg-canvas-hover'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-canvas rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full border-collapse text-left tabular-nums">
              <thead className="sticky top-0 bg-canvas-subtle z-10">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-muted border-b border-canvas-divider">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-3">Peso</th>
                  <th className="py-3 px-3">IMC</th>
                  <th className="py-3 px-3">Gordura (est.)</th>
                  <th className="py-3 px-3">Músc. esq. (est.)</th>
                  <th className="py-3 px-4">Massa musc. (est.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-divider/60 text-[13px]">
                {filteredDesc.map((row) => {
                  const delta = deltaById.get(row.id);
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-canvas-subtle/70 transition-colors"
                    >
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-ink">{row.date}</span>
                        <span className="text-[12px] text-ink-muted ml-2">{row.time}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-ink">
                          {formatPtNumber(row.weightKg, 2)} kg
                        </span>
                        {delta !== undefined && Math.abs(delta) >= 0.01 && (
                          <span
                            className={`ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                              delta < 0
                                ? 'bg-sage-soft text-ink-optimal'
                                : 'bg-terracotta-pill text-terracotta-ink'
                            }`}
                          >
                            {delta > 0 ? '+' : '−'}
                            {formatPtNumber(Math.abs(delta), 2)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-ink-secondary font-medium">
                        {formatPtNumber(row.bmi, 1)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-ink-muted">
                        {row.bodyFatPct !== undefined ? (
                          <>
                            <span>{formatPtNumber(row.bodyFatPct, 1)}%</span>
                            {row.fatMassKg !== undefined && (
                              <span className="text-[11px] ml-1.5">
                                ({formatPtNumber(row.fatMassKg, 1)} kg)
                              </span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-ink-muted">
                        {row.skeletalMusclePct !== undefined ? (
                          <>
                            <span>{formatPtNumber(row.skeletalMusclePct, 1)}%</span>
                            {row.skeletalMuscleKg !== undefined && (
                              <span className="text-[11px] ml-1.5">
                                ({formatPtNumber(row.skeletalMuscleKg, 1)} kg)
                              </span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-ink-muted">
                        {row.muscleMassKg !== undefined ? (
                          <>
                            <span>{formatPtNumber(row.muscleMassKg, 1)} kg</span>
                            {row.muscleRatePct !== undefined && (
                              <span className="text-[11px] ml-1.5">
                                ({formatPtNumber(row.muscleRatePct, 1)}%)
                              </span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
