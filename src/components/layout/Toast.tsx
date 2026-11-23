import React from 'react';
import { useHealth } from '../../context/HealthContext';

export const Toast: React.FC = () => {
  const { toast } = useHealth();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 bottom-24 wide:bottom-8 -translate-x-1/2 z-50 bg-ink text-canvas rounded-full px-5 py-3 text-[14px] font-medium whitespace-nowrap shadow-[0_8px_24px_rgba(45,49,43,0.18)]"
    >
      {toast}
    </div>
  );
};
