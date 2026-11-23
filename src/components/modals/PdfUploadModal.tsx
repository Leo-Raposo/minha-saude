import React from 'react';
import { X } from 'lucide-react';
import { useHealth } from '../../context/HealthContext';
import { PdfUploadZone } from '../labs/PdfUploadZone';

export const PdfUploadModal: React.FC = () => {
  const { uploadModalOpen, closeUploadModal, setScreen } = useHealth();

  if (!uploadModalOpen) return null;

  return (
    <div
      onClick={closeUploadModal}
      className="fixed inset-0 z-40 bg-ink/30 flex items-end wide:items-center justify-center p-0 wide:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-canvas rounded-t-[24px] wide:rounded-[24px] px-[22px] pt-3 pb-7 flex flex-col gap-5"
      >
        <div className="w-10 h-1 rounded-full bg-canvas-divider mx-auto wide:hidden" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="m-0 text-[20px] font-semibold tracking-[-0.015em] text-ink">
              Subir exame de sangue (PDF)
            </h2>
            <p className="m-0 text-[13px] text-ink-muted">
              Envie o laudo do laboratório para atualizar seus biomarcadores.
            </p>
          </div>
          <button
            type="button"
            onClick={closeUploadModal}
            aria-label="Fechar"
            className="w-9 h-9 rounded-[12px] bg-canvas-card hover:bg-canvas-hover text-ink flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <PdfUploadZone
          onImported={() => {
            setScreen('labs');
          }}
        />
      </div>
    </div>
  );
};
