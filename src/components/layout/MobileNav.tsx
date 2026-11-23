import React from 'react';
import { Activity, Droplets, Home, Plus } from 'lucide-react';
import { useHealth } from '../../context/HealthContext';
import { ScreenId } from '../../types/health';

const NAV_ITEMS: { id: ScreenId; short: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', short: 'Início', icon: Home },
  { id: 'labs', short: 'Exames', icon: Droplets },
  { id: 'body', short: 'Corpo', icon: Activity },
];

export const MobileHeader: React.FC = () => {
  const { state } = useHealth();
  return (
    <div className="flex wide:hidden items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <div className="w-8 h-8 rounded-[11px] bg-sage flex items-center justify-center font-bold text-[15px] text-ink">
          M
        </div>
        <span className="font-bold text-[17px] tracking-[-0.02em] text-ink">Minha Saúde</span>
      </div>
      <div
        title={`${state.profile.name} (${state.profile.age} anos)`}
        className="w-10 h-10 rounded-full bg-sage-soft flex items-center justify-center text-[13px] font-semibold text-ink"
      >
        {state.profile.initials}
      </div>
    </div>
  );
};

export const BottomNav: React.FC = () => {
  const { screen, setScreen, openMeasurementDrawer } = useHealth();

  return (
    <nav
      aria-label="Navegação inferior"
      className="wide:hidden fixed left-3 right-3 bottom-3 z-20 bg-canvas-card rounded-[24px] p-2 flex items-center justify-around gap-1 shadow-[0_0_0_1px_rgba(45,49,43,0.06)]"
    >
      {NAV_ITEMS.map(({ id, short, icon: Icon }) => {
        const active = screen === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setScreen(id)}
            className={`flex-1 min-h-[54px] flex flex-col items-center justify-center gap-[3px] rounded-[18px] text-[11px] text-ink transition-colors cursor-pointer ${
              active ? 'bg-sage-soft font-semibold' : 'bg-transparent font-medium'
            }`}
          >
            <Icon className="w-[21px] h-[21px]" />
            <span>{short}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={openMeasurementDrawer}
        title="Registrar medição"
        aria-label="Registrar medição"
        className="flex-none w-[54px] h-[54px] rounded-[18px] bg-sage-mid hover:bg-sage-hover text-ink flex items-center justify-center transition-colors cursor-pointer"
      >
        <Plus className="w-[22px] h-[22px]" strokeWidth={1.9} />
      </button>
    </nav>
  );
};
