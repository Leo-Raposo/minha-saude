import React, { useRef, useState } from 'react';
import { Check, FileText, Upload } from 'lucide-react';
import { useHealth } from '../../context/HealthContext';
import { computeBiomarkerStatus, STATUS_TOKENS } from '../../data/mockHealthData';
import { pdfParserService } from '../../services/pdfParserService';
import { ExtractedBiomarkerDraft, ParsedPdfResult } from '../../types/health';

interface PdfUploadZoneProps {
  onImported?: () => void;
}

export const PdfUploadZone: React.FC<PdfUploadZoneProps> = ({ onImported }) => {
  const { importExtractedExam } = useHealth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<'idle' | 'busy' | 'review' | 'done'>('idle');
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileObjectUrl, setFileObjectUrl] = useState<string | undefined>(undefined);
  const [parsed, setParsed] = useState<ParsedPdfResult | null>(null);
  const [draftMarkers, setDraftMarkers] = useState<ExtractedBiomarkerDraft[]>([]);

  const processFile = async (file: File) => {
    setStatus('busy');
    setProgress(0);
    setFileName(file.name);
    setFileObjectUrl(file.size > 0 ? URL.createObjectURL(file) : undefined);
    setDrag(false);

    const result = await pdfParserService.parseBloodTestPdf(file, (pct) => {
      setProgress(pct);
    });
    setParsed(result);
    setDraftMarkers(result.markers);
    setStatus('review');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    } else {
      const mockFile = new File([''], 'laudo-exame-sangue.pdf', { type: 'application/pdf' });
      void processFile(mockFile);
    }
  };

  const toggleMarker = (id: string) => {
    setDraftMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const updateMarkerValue = (id: string, raw: string) => {
    const num = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(num)) return;
    setDraftMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, value: num } : m)));
  };

  const confirmImport = () => {
    if (!parsed) return;
    importExtractedExam({
      fileName: parsed.fileName,
      fileUrl: fileObjectUrl,
      lab: parsed.detectedLab,
      dateLabel: parsed.detectedDate,
      isoDate: parsed.isoDate,
      markers: draftMarkers,
    });
    setStatus('done');
    onImported?.();
  };

  const reset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStatus('idle');
    setProgress(0);
    setParsed(null);
    setDraftMarkers([]);
  };

  const selectedCount = draftMarkers.filter((m) => m.selected).length;

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => {
          if (status === 'idle' || status === 'done') fileRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!drag) setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrag(false);
        }}
        onDrop={handleDrop}
        className={`border-[1.5px] border-dashed rounded-card px-[clamp(18px,3vw,28px)] py-[22px] flex items-center gap-[18px] flex-wrap transition-colors ${
          status === 'idle' || status === 'done' ? 'cursor-pointer' : ''
        } ${
          drag
            ? 'border-sage-line bg-sage-soft'
            : 'border-sage-mid bg-canvas-card'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-[52px] h-[52px] flex-none rounded-[16px] bg-canvas flex items-center justify-center text-ink-sageStrong">
          {status === 'done' ? (
            <Check className="w-6 h-6" strokeWidth={1.8} />
          ) : status === 'review' ? (
            <FileText className="w-6 h-6" strokeWidth={1.6} />
          ) : (
            <Upload className="w-6 h-6" strokeWidth={1.6} />
          )}
        </div>

        {status === 'idle' && (
          <>
            <div className="flex-1 min-w-[200px] flex flex-col gap-[3px]">
              <span className="text-[15px] font-semibold text-ink">
                Arraste um PDF de exame de sangue aqui
              </span>
              <span className="text-[13px] text-ink-muted">
                ou toque para selecionar. Os biomarcadores são estruturados para revisão antes de salvar.
              </span>
            </div>
            <span className="text-[13px] font-semibold px-4 py-[10px] rounded-full bg-sage text-ink">
              Escolher PDF
            </span>
          </>
        )}

        {status === 'busy' && (
          <div className="flex-1 min-w-[200px] flex flex-col gap-[10px]">
            <div className="flex justify-between gap-3 text-[14px]">
              <span className="font-semibold text-ink truncate">{fileName}</span>
              <span className="text-ink-muted tabular-nums">
                {progress < 70 ? `Enviando ${progress}%` : 'Lendo biomarcadores…'}
              </span>
            </div>
            <div className="h-[6px] rounded-full bg-canvas overflow-hidden">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-sage-mid rounded-full transition-[width] duration-150"
              />
            </div>
          </div>
        )}

        {status === 'review' && parsed && (
          <>
            <div className="flex-1 min-w-[200px] flex flex-col gap-[3px]">
              <span className="text-[15px] font-semibold text-ink">{parsed.fileName}</span>
              <span className="text-[13px] text-ink-sageStrong">
                {parsed.detectedLab} · {parsed.detectedDate} · Revise os valores extraídos abaixo
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[13px] font-semibold px-4 py-[10px] rounded-full bg-canvas hover:bg-canvas-subtle text-ink cursor-pointer"
            >
              Cancelar
            </button>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="flex-1 min-w-[200px] flex flex-col gap-[3px]">
              <span className="text-[15px] font-semibold text-ink">{fileName}</span>
              <span className="text-[13px] text-ink-sageStrong">
                {selectedCount} biomarcadores extraídos e adicionados ao seu histórico
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[13px] font-semibold px-4 py-[10px] rounded-full bg-canvas hover:bg-canvas-subtle text-ink cursor-pointer"
            >
              Enviar outro PDF
            </button>
          </>
        )}
      </div>

      {/* Extracted Biomarkers Review Panel */}
      {status === 'review' && parsed && (
        <div className="bg-canvas-card rounded-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="m-0 text-[16px] font-semibold text-ink">
                Prévia da extração (parser simulado)
              </h3>
              <p className="m-0 text-[12px] text-ink-muted">
                Ajuste qualquer valor ou desmarque itens antes de incorporar ao histórico.
              </p>
            </div>
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-sage-soft text-ink-optimal tabular-nums">
              {selectedCount} selecionados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {draftMarkers.map((m) => {
              const st = STATUS_TOKENS[computeBiomarkerStatus(m.value, m.lo, m.hi)];
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-[14px] bg-canvas transition-opacity ${
                    m.selected ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={m.selected}
                    onChange={() => toggleMarker(m.id)}
                    className="w-4 h-4 accent-ink cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink truncate">{m.name}</div>
                    <div className="text-[11px] text-ink-muted tabular-nums">
                      Ref: {m.lo}–{m.hi} {m.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      value={m.value}
                      onChange={(e) => updateMarkerValue(m.id, e.target.value)}
                      className="w-[70px] px-2 py-1 rounded-[10px] bg-canvas-card text-right text-[14px] font-semibold text-ink tabular-nums"
                    />
                    <span
                      style={{ backgroundColor: st.bg, color: st.fg }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 rounded-[14px] bg-canvas text-ink text-[13px] font-semibold cursor-pointer hover:bg-canvas-subtle"
            >
              Descartar
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={confirmImport}
              className="px-5 py-2.5 rounded-[14px] bg-ink hover:bg-ink-hover disabled:opacity-40 text-canvas text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Adicionar {selectedCount} marcadores ao histórico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
