import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Download, ExternalLink, Eye, FileText } from 'lucide-react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHealth } from '../../context/HealthContext';
import {
  BIOMARKER_CATEGORIES,
  getStatusPillLabel,
  STATUS_TOKENS,
} from '../../data/mockHealthData';
import { LabExamRecord } from '../../types/health';
import { ReferenceRangeBar } from '../common/ReferenceRangeBar';
import { PdfViewerModal } from '../modals/PdfViewerModal';
import { PdfUploadZone } from './PdfUploadZone';

function getDecimalPlaces(v: number): number {
  const s = String(v);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

export const BloodTestsView: React.FC = () => {
  const {
    state,
    selectedBiomarkerId,
    setSelectedBiomarkerId,
    selectedCategory,
    setSelectedCategory,
  } = useHealth();

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    'hdl-0': true,
  });
  const [viewingExam, setViewingExam] = useState<LabExamRecord | null>(null);
  const [showAllExams, setShowAllExams] = useState(false);

  const { biomarkers, labExams } = state;

  const counts = useMemo(
    () => ({
      optimal: biomarkers.filter((b) => b.status === 'optimal').length,
      borderline: biomarkers.filter((b) => b.status === 'borderline').length,
      out: biomarkers.filter((b) => b.status === 'out').length,
    }),
    [biomarkers]
  );

  const filteredMarkers = useMemo(
    () =>
      biomarkers.filter(
        (b) => selectedCategory === 'Todos' || b.category === selectedCategory
      ),
    [biomarkers, selectedCategory]
  );

  const selectedMarker = useMemo(
    () =>
      biomarkers.find((b) => b.id === selectedBiomarkerId) ??
      filteredMarkers[0] ??
      biomarkers[0],
    [biomarkers, filteredMarkers, selectedBiomarkerId]
  );

  const selStatus = STATUS_TOKENS[selectedMarker.status];
  const selPillLabel = getStatusPillLabel(selectedMarker);

  const firstPoint = selectedMarker.history[0];
  const decimals = getDecimalPlaces(selectedMarker.value);
  const delta = selectedMarker.value - firstPoint.value;
  const deltaLabel =
    selectedMarker.history.length > 1
      ? `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(decimals)} desde ${firstPoint.date}`
      : `Coleta em ${firstPoint.date}`;

  const histValues = selectedMarker.history.map((h) => h.value);
  const rawMin = Math.min(...histValues, selectedMarker.lo);
  const rawMax = Math.max(...histValues, selectedMarker.hi);
  const padY = Math.max((rawMax - rawMin) * 0.16, 1);
  const yDomainMin = Number((rawMin - padY).toFixed(2));
  const yDomainMax = Number((rawMax + padY).toFixed(2));

  const insights = selectedMarker.insights ?? [
    {
      title: 'O que significa',
      body: `Seu resultado de ${selectedMarker.name} (${selectedMarker.value} ${selectedMarker.unit}) está confortavelmente dentro da faixa ideal de referência.`,
    },
    {
      title: 'Manutenção',
      body: 'Nenhuma intervenção imediata necessária. Mantenha seus hábitos atuais e acompanhe no próximo painel de rotina.',
    },
  ];

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectMarker = (id: string) => {
    setSelectedBiomarkerId(id);
    setOpenAccordions((prev) => ({ ...prev, [`${id}-0`]: true }));
    if (window.innerWidth < 880) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="m-0 text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.025em] leading-[1.15] text-ink">
          Exames de sangue
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted tabular-nums">
          <span>Último painel · {labExams[0]?.date ?? '07 Nov 2026'}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-sage-mid" />
            {counts.optimal} ideais
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-sand-dot" />
            {counts.borderline} atenção
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full bg-terracotta-dot" />
            {counts.out} fora da faixa
          </span>
        </div>
      </header>

      {/* Original PDF Lab Reports Shelf (ready for doctor viewing) */}
      {labExams.length > 0 && (
        <section className="bg-canvas-card rounded-card p-[clamp(16px,2.5vw,22px)] flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <h2 className="m-0 text-[16px] font-semibold tracking-[-0.015em] text-ink">
                Laudos originais em PDF
              </h2>
              <span className="text-[12px] text-ink-muted">
                Abra o laudo completo na tela durante a consulta médica ou baixe o arquivo.
              </span>
            </div>
            <span className="flex-none text-[12px] font-semibold px-3 py-1 rounded-full bg-canvas text-ink-secondary tabular-nums">
              {labExams.length} {labExams.length === 1 ? 'laudo' : 'laudos'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {labExams.map((exam, idx) => {
              const hiddenOnMobile = idx > 0 && !showAllExams;
              const hiddenOnDesktop = idx >= 3 && !showAllExams;
              const visibilityClass = hiddenOnDesktop
                ? 'hidden'
                : hiddenOnMobile
                  ? 'hidden md:flex'
                  : 'flex';

              return (
                <div
                  key={exam.id}
                  className={`${visibilityClass} bg-canvas rounded-[16px] p-3.5 flex-col gap-3 border border-transparent hover:border-sage transition-colors`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 flex-none rounded-[11px] bg-sage-soft flex items-center justify-center text-ink-optimal">
                      <FileText className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-ink tabular-nums truncate">
                          {exam.date}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-soft text-ink-optimal">
                            Mais recente
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-ink-secondary font-medium truncate">
                        {exam.lab}
                      </span>
                      <span className="text-[11px] text-ink-muted truncate tabular-nums">
                        {exam.doctor} · {exam.markerCount} marcadores
                      </span>
                    </div>
                  </div>

                  {exam.fileUrl ? (
                    <div className="flex items-center gap-1.5 mt-auto pt-0.5">
                      <button
                        type="button"
                        onClick={() => setViewingExam(exam)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 px-3 bg-sage hover:bg-sage-hover text-ink text-[12px] font-semibold cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" strokeWidth={1.9} />
                        Visualizar PDF
                      </button>
                      <a
                        href={exam.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir em nova aba"
                        aria-label={`Abrir ${exam.lab} ${exam.date} em nova aba`}
                        className="w-8 h-8 flex-none rounded-full bg-canvas-card hover:bg-sage-soft text-ink flex items-center justify-center transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </a>
                      <a
                        href={exam.fileUrl}
                        download={exam.fileName}
                        title="Baixar PDF"
                        aria-label={`Baixar ${exam.lab} ${exam.date}`}
                        className="w-8 h-8 flex-none rounded-full bg-canvas-card hover:bg-sage-soft text-ink flex items-center justify-center transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-muted mt-auto">
                      PDF local indisponível nesta sessão
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {labExams.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllExams((v) => !v)}
              className={`${
                labExams.length <= 3 ? 'flex md:hidden' : 'flex'
              } w-full items-center justify-center gap-1.5 rounded-[14px] py-2.5 px-4 bg-canvas hover:bg-canvas-subtle text-[13px] font-semibold text-ink-secondary cursor-pointer transition-colors tabular-nums`}
            >
              <span>
                {showAllExams
                  ? 'Ocultar laudos anteriores'
                  : `Ver mais ${labExams.length - 1} ${
                      labExams.length - 1 === 1 ? 'laudo anterior' : 'laudos anteriores'
                    }`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-ink-muted transition-transform duration-200 ${
                  showAllExams ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </section>
      )}

      {/* PDF Upload Dropzone */}
      <PdfUploadZone />

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 no-scrollbar">
        {BIOMARKER_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex-none rounded-full px-4 py-[9px] text-[13px] font-semibold cursor-pointer transition-colors ${
                active
                  ? 'bg-sage text-ink'
                  : 'bg-canvas-card hover:bg-sage-soft text-ink'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Split: Sticky Detail Panel + Biomarkers Grid */}
      <div className="flex flex-wrap gap-4 items-start">
        {/* Sticky Detail Panel */}
        <section className="flex-[1.35_1_380px] min-w-0 bg-canvas-card rounded-card p-[clamp(18px,3vw,28px)] flex flex-col gap-[22px] wide:sticky wide:top-5">
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-muted font-semibold tracking-[0.06em] uppercase">
                {selectedMarker.category}
              </span>
              <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-ink">
                {selectedMarker.name}
              </h2>
              <span className="text-[13px] text-ink-muted leading-[1.5]">
                {selectedMarker.desc}
              </span>
            </div>
            <span
              style={{ backgroundColor: selStatus.bg, color: selStatus.fg }}
              className="flex-none text-[12px] font-semibold px-[11px] py-[5px] rounded-full"
            >
              {selPillLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-2 tabular-nums flex-wrap">
            <span className="text-[44px] font-semibold tracking-[-0.035em] leading-none text-ink">
              {selectedMarker.value}
            </span>
            <span className="text-[15px] text-ink-muted font-medium">
              {selectedMarker.unit}
            </span>
            <span className="ml-auto text-[13px] text-ink-secondary font-medium">
              {deltaLabel}
            </span>
          </div>

          {/* Large Reference Range Bar */}
          <ReferenceRangeBar
            value={selectedMarker.value}
            lo={selectedMarker.lo}
            hi={selectedMarker.hi}
            min={selectedMarker.min}
            max={selectedMarker.max}
            size="lg"
          />

          {/* Interactive Recharts Evolution Chart */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">
                Evolução histórica
              </span>
              <span className="text-[11px] text-ink-sageStrong font-semibold">
                Faixa ideal: {selectedMarker.lo}–{selectedMarker.hi} {selectedMarker.unit}
              </span>
            </div>

            <div className="relative h-[180px] bg-canvas rounded-[16px] pt-3 pr-3 pb-1 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={selectedMarker.history}
                  margin={{ top: 10, right: 14, left: 0, bottom: 4 }}
                >
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#5F6459', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[yDomainMin, yDomainMax]}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tick={{ fill: '#5F6459', fontSize: 11 }}
                  />
                  <ReferenceArea
                    y1={selectedMarker.lo}
                    y2={selectedMarker.hi}
                    fill="#DCE3D2"
                    fillOpacity={0.72}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0].payload as {
                        date: string;
                        value: number;
                        lab?: string;
                      };
                      return (
                        <div className="bg-ink text-canvas px-3 py-2 rounded-[12px] text-[12px] tabular-nums shadow-sm">
                          <div className="font-semibold">
                            {pt.value} {selectedMarker.unit}
                          </div>
                          <div className="text-sage-soft text-[11px]">
                            {pt.date} {pt.lab ? `· ${pt.lab}` : ''}
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
                    fill="#B5C2A3"
                    fillOpacity={0.25}
                    dot={{
                      r: 4.5,
                      fill: '#F6F5F0',
                      stroke: '#7E8F6A',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#7E8F6A',
                      stroke: '#F6F5F0',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Value/Date Summary Strip */}
            <div className="flex justify-around gap-2 px-1 tabular-nums">
              {selectedMarker.history.map((pt) => (
                <div
                  key={`${selectedMarker.id}-${pt.isoDate}-${pt.value}`}
                  className="flex flex-col items-center gap-[2px] min-w-[52px]"
                >
                  <span className="text-[13px] font-semibold text-ink">{pt.value}</span>
                  <span className="text-[11px] text-ink-muted">{pt.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Insights Accordions */}
          <div className="flex flex-col gap-2">
            {insights.map((ins, i) => {
              const key = `${selectedMarker.id}-${i}`;
              const isOpen = !!openAccordions[key];
              const dotColor = i === 0 ? '#99AA84' : selStatus.dot;
              return (
                <div key={key} className="bg-canvas rounded-[16px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleAccordion(key)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-[15px] bg-transparent text-ink text-left text-[14px] font-semibold cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        style={{ backgroundColor: dotColor }}
                        className="w-1.5 h-1.5 rounded-full flex-none"
                      />
                      {ins.title}
                    </span>
                    <ChevronRight
                      className={`w-[18px] h-[18px] flex-none text-ink-muted transition-transform duration-200 ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="m-0 px-4 pb-4 pl-8 text-[13px] leading-[1.6] text-ink-secondary">
                      {ins.body}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Biomarkers List Grid */}
        <div className="flex-[1_1_300px] min-w-0 grid grid-cols-1 sm:grid-cols-2 wide:grid-cols-1 xl:grid-cols-2 gap-2.5">
          {filteredMarkers.map((mk) => {
            const st = STATUS_TOKENS[mk.status];
            const pillLabel = getStatusPillLabel(mk);
            const active = mk.id === selectedMarker.id;
            const sparkData = mk.history.map((h, i) => ({ i, v: h.value }));

            return (
              <button
                key={mk.id}
                type="button"
                onClick={() => handleSelectMarker(mk.id)}
                className={`flex flex-col gap-3 p-4 rounded-[18px] bg-canvas-card text-ink text-left transition-colors cursor-pointer border-[1.5px] ${
                  active
                    ? 'border-sage-mid'
                    : 'border-transparent hover:border-sage'
                }`}
              >
                <div className="flex justify-between items-center gap-2 w-full">
                  <span className="text-[14px] font-semibold truncate">{mk.name}</span>
                  <span
                    style={{ backgroundColor: st.bg, color: st.fg }}
                    className="flex-none text-[11px] font-semibold px-[9px] py-[3px] rounded-full"
                  >
                    {pillLabel}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-2 w-full">
                  <div className="flex items-baseline gap-[5px] tabular-nums">
                    <span className="text-[24px] font-semibold tracking-[-0.02em] leading-none">
                      {mk.value}
                    </span>
                    <span className="text-[12px] text-ink-muted">{mk.unit}</span>
                  </div>
                  {sparkData.length > 1 && (
                    <div className="w-[72px] h-6 flex-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke="#99AA84"
                            strokeWidth={1.7}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <ReferenceRangeBar
                  value={mk.value}
                  lo={mk.lo}
                  hi={mk.hi}
                  min={mk.min}
                  max={mk.max}
                  size="sm"
                />

                <span className="text-[12px] text-ink-muted tabular-nums">
                  {mk.refLabel ?? `Ideal ${mk.lo}–${mk.hi}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* In-App PDF Viewer Modal */}
      <PdfViewerModal exam={viewingExam} onClose={() => setViewingExam(null)} />
    </div>
  );
};
