import React, { useEffect } from 'react';
import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { LabExamRecord } from '../../types/health';

interface PdfViewerModalProps {
  exam: LabExamRecord | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ exam, onClose }) => {
  useEffect(() => {
    if (!exam) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exam, onClose]);

  if (!exam || !exam.fileUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-2 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[980px] h-[90vh] bg-canvas rounded-[24px] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-canvas-card border-b border-canvas-divider flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex-none rounded-[12px] bg-sage-soft flex items-center justify-center text-ink-optimal">
              <FileText className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-semibold text-ink truncate">
                {exam.lab} · <span className="tabular-nums">{exam.date}</span>
              </span>
              <span className="text-[12px] text-ink-muted truncate">
                {exam.doctor} · {exam.fileName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={exam.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-canvas hover:bg-sage-soft text-[12px] font-semibold text-ink no-underline transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.9} />
              <span className="hidden sm:inline">Nova aba</span>
            </a>
            <a
              href={exam.fileUrl}
              download={exam.fileName}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 bg-sage hover:bg-sage-hover text-[12px] font-semibold text-ink no-underline transition-colors"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.9} />
              <span className="hidden sm:inline">Baixar PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar visualizador"
              className="w-9 h-9 rounded-[12px] bg-canvas hover:bg-canvas-hover text-ink flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 bg-canvas-subtle p-2 sm:p-3">
          <iframe
            src={exam.fileUrl}
            title={`Laudo ${exam.lab} - ${exam.date}`}
            className="w-full h-full rounded-[14px] border border-canvas-divider bg-canvas"
          />
        </div>
      </div>
    </div>
  );
};
