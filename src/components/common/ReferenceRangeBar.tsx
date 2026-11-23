import React from 'react';

interface ReferenceRangeBarProps {
  value: number;
  lo: number;
  hi: number;
  min: number;
  max: number;
  size?: 'sm' | 'lg';
}

export const ReferenceRangeBar: React.FC<ReferenceRangeBarProps> = ({
  value,
  lo,
  hi,
  min,
  max,
  size = 'sm',
}) => {
  const span = Math.max(max - min, 1);
  const lowW = Math.max(5, Math.min(85, ((lo - min) / span) * 100));
  const optW = Math.max(10, Math.min(90 - lowW, ((hi - lo) / span) * 100));
  const hiPos = lowW + optW;
  const pos = Math.max(2, Math.min(98, ((value - min) / span) * 100));

  if (size === 'sm') {
    return (
      <div className="relative h-[6px] flex gap-[2px] w-full">
        <div
          style={{ width: `${lowW.toFixed(1)}%` }}
          className="bg-sand-low rounded-l-full"
        />
        <div style={{ width: `${optW.toFixed(1)}%` }} className="bg-sage" />
        <div className="flex-1 bg-terracotta-high rounded-r-full" />
        <div
          style={{ left: `${pos.toFixed(1)}%` }}
          className="absolute top-1/2 w-3 h-3 -mt-[6px] -ml-[6px] rounded-full bg-ink border-2 border-canvas-card"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-[10px] flex gap-[3px]">
        <div
          style={{ width: `${lowW.toFixed(1)}%` }}
          className="bg-sand-low rounded-l-full"
        />
        <div style={{ width: `${optW.toFixed(1)}%` }} className="bg-sage" />
        <div className="flex-1 bg-terracotta-high rounded-r-full" />
        <div
          style={{ left: `${pos.toFixed(1)}%` }}
          className="absolute top-1/2 w-[18px] h-[18px] -mt-[9px] -ml-[9px] rounded-full bg-ink border-[3px] border-canvas-card transition-[left] duration-300"
        />
      </div>
      <div className="relative h-4 text-[12px] text-ink-muted tabular-nums">
        <span className="absolute left-0">Baixo</span>
        <span
          style={{ left: `${lowW.toFixed(1)}%` }}
          className="absolute -translate-x-1/2"
        >
          {lo}
        </span>
        <span
          style={{ left: `${hiPos.toFixed(1)}%` }}
          className="absolute -translate-x-1/2"
        >
          {hi}
        </span>
        <span className="absolute right-0">Alto</span>
      </div>
    </div>
  );
};
