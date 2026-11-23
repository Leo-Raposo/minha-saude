import React from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Home,
  Plus,
} from 'lucide-react';
import { useHealth } from '../../context/HealthContext';
import { ScreenId } from '../../types/health';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { id: ScreenId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Visão geral', icon: Home },
  { id: 'labs', label: 'Exames de sangue', icon: Droplets },
  { id: 'body', label: 'Bioimpedância', icon: Activity },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const { screen, setScreen, openMeasurementDrawer, state } = useHealth();
  const { profile } = state;

  return (
    <aside
      style={{ width: open ? 240 : 76 }}
      className="hidden wide:flex flex-none h-screen sticky top-0 bg-canvas-card px-[14px] py-5 flex-col gap-7 transition-[width] duration-200 ease-out overflow-hidden"
    >
      {/* Brand + Collapse button */}
      <div className="flex items-center justify-between gap-2 min-h-[40px]">
        <div className="flex items-center gap-[10px] pl-1">
          <div className="w-[34px] h-[34px] flex-none rounded-[12px] bg-sage flex items-center justify-center font-bold text-[16px] text-ink">
            M
          </div>
          {open && (
            <span className="font-bold text-[17px] tracking-[-0.02em] text-ink whitespace-nowrap">
              Minha Saúde
            </span>
          )}
        </div>
        {open && (
          <button
            type="button"
            onClick={onToggle}
            title="Recolher barra lateral"
            aria-label="Recolher barra lateral"
            className="w-8 h-8 rounded-[10px] bg-transparent text-ink-muted hover:bg-canvas-hoverAlt flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={1.7} />
          </button>
        )}
      </div>

      {!open && (
        <button
          type="button"
          onClick={onToggle}
          title="Expandir barra lateral"
          aria-label="Expandir barra lateral"
          className="w-12 h-8 -mt-[18px] rounded-[10px] bg-transparent text-ink-muted hover:bg-canvas-hoverAlt flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-[18px] h-[18px]" strokeWidth={1.7} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-1" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = screen === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setScreen(id)}
              title={label}
              className={`flex items-center gap-3 h-[46px] px-[13px] rounded-[14px] text-[14px] text-ink text-left whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'bg-sage-soft font-semibold'
                  : 'bg-transparent font-medium hover:bg-canvas-hoverAlt'
              }`}
            >
              <Icon className="w-[21px] h-[21px] flex-none" />
              {open && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom CTA + Profile */}
      <div className="mt-auto flex flex-col gap-[14px]">
        <button
          type="button"
          onClick={openMeasurementDrawer}
          title="Registrar medição"
          className="flex items-center justify-center gap-[10px] h-[46px] px-[13px] rounded-[14px] bg-sage hover:bg-sage-hover text-ink text-[14px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 flex-none" strokeWidth={1.9} />
          {open && <span>Registrar medição</span>}
        </button>

        <div className="flex items-center gap-[10px] p-1">
          <div className="w-10 h-10 flex-none rounded-full bg-sage-soft flex items-center justify-center text-[13px] font-semibold text-ink">
            {profile.initials}
          </div>
          {open && (
            <div className="flex flex-col gap-[2px] whitespace-nowrap min-w-0">
              <span className="text-[13px] font-semibold text-ink truncate">{profile.name}</span>
              <span className="text-[12px] text-ink-muted tabular-nums">
                {profile.age} anos · {profile.gender} · {profile.heightCm} cm
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
