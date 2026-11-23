import React, { useState } from 'react';
import { BioimpedanceEntry } from '../../types/health';

type CalloutId = 'fat' | 'muscle' | 'visceral' | 'water' | 'bmr';

interface HumanBodyInteractiveProps {
  entry: BioimpedanceEntry;
  muscleDeltaLabel: string;
}

export const HumanBodyInteractive: React.FC<HumanBodyInteractiveProps> = ({
  entry,
  muscleDeltaLabel,
}) => {
  const [activeId, setActiveId] = useState<CalloutId>('muscle');

  const callouts: {
    id: CalloutId;
    label: string;
    value: string;
    unit: string;
    note: string;
    detail: string;
    positionClass: string;
    dotCx: number;
    dotCy: number;
  }[] = [
    {
      id: 'fat',
      label: 'Gordura corporal',
      value: entry.bodyFatPct.toFixed(1),
      unit: '%',
      note: 'Ideal 8–20%',
      detail: entry.segmental
        ? `Massa adiposa: ${(entry.weightKg * entry.bodyFatPct / 100).toFixed(1)} kg · Tronco ${entry.segmental.trunk.fatPct}% · Braços ${entry.segmental.leftArm.fatPct}% · Pernas ${entry.segmental.leftLeg.fatPct}%`
        : `Massa adiposa estimada em ${((entry.weightKg * entry.bodyFatPct) / 100).toFixed(1)} kg.`,
      positionClass: 'left-0 top-0',
      dotCx: 106,
      dotCy: 128,
    },
    {
      id: 'muscle',
      label: 'Massa magra',
      value: entry.muscleMassKg.toFixed(1),
      unit: 'kg',
      note: muscleDeltaLabel,
      detail: entry.segmental
        ? `Tronco ${entry.segmental.trunk.muscleKg} kg · Braço Esq ${entry.segmental.leftArm.muscleKg} kg / Dir ${entry.segmental.rightArm.muscleKg} kg · Perna Esq ${entry.segmental.leftLeg.muscleKg} kg / Dir ${entry.segmental.rightLeg.muscleKg} kg`
        : `Corresponde a ${entry.muscleMassPct.toFixed(1)}% do peso corporal total.`,
      positionClass: 'right-0 top-0',
      dotCx: 168,
      dotCy: 106,
    },
    {
      id: 'visceral',
      label: 'Gordura visceral',
      value: String(entry.visceralFat),
      unit: 'nível',
      note: 'Saudável 1–12',
      detail: `Nível ${entry.visceralFat} indica ${
        entry.visceralFat <= 9
          ? 'baixa gordura intra-abdominal ao redor dos órgãos vitais — excelente marcador metabólico.'
          : entry.visceralFat <= 12
            ? 'gordura intra-abdominal dentro da faixa saudável — vale manter o acompanhamento.'
            : 'gordura intra-abdominal acima do ideal — atenção redobrada ao perfil metabólico.'
      }`,
      positionClass: 'left-0 top-[238px]',
      dotCx: 150,
      dotCy: 148,
    },
    {
      id: 'water',
      label: 'Hidratação',
      value: entry.waterPct.toFixed(1),
      unit: '%',
      note: 'Ideal 50–65%',
      detail: `Aproximadamente ${((entry.weightKg * entry.waterPct) / 100).toFixed(1)} kg de água corporal total — hidratação celular adequada.`,
      positionClass: 'right-0 top-[238px]',
      dotCx: 169,
      dotCy: 224,
    },
    {
      id: 'bmr',
      label: 'Taxa metabólica',
      value: String(entry.bmrKcal),
      unit: 'kcal',
      note: 'Gasto basal / dia',
      detail: `Energia mínima diária em repouso. Massa óssea: ${entry.boneMassKg.toFixed(1)} kg${
        entry.sarcopeniaIndex ? ` · Índice muscular: ${entry.sarcopeniaIndex} kg/m²` : ''
      }.`,
      positionClass: 'left-1/2 -translate-x-1/2 top-[406px]',
      dotCx: 131,
      dotCy: 224,
    },
  ];

  const activeCallout = callouts.find((c) => c.id === activeId) ?? callouts[0];

  // Exact symmetric anatomical human silhouette (viewBox 0 0 300 370, center x = 150)
  const bodySilhouettePath =
    'M 150 18 C 152.4 18, 154.6 18.9, 156.7 19.8 C 158.8 20.7, 160.2 21.4, 161.6 23.1 C 163 24.8, 163.8 27.1, 164.4 29.1 C 165.1 31.1, 164.5 32.5, 165.2 34.2 C 166 35.8, 168.3 36.8, 168.7 38.3 C 169.1 39.7, 168.8 39.9, 167.5 42.3 C 166.1 44.7, 162.3 48.5, 161.1 51.4 C 159.9 54.3, 160.5 56.5, 160.7 58.5 C 160.9 60.5, 160.5 60.7, 162.1 62.5 C 163.7 64.4, 164.6 66.1, 169.8 68.9 C 175 71.7, 186 75, 191.1 78.1 C 196.1 81.1, 196.4 83.5, 197.8 85.8 C 199.3 88.1, 199.1 87.2, 199.2 90.9 C 199.3 94.5, 197.6 98.8, 198.3 106.1 C 199 113.4, 201.9 123.2, 203.1 131.4 C 204.4 139.6, 205 144.9, 205.2 151.6 C 205.4 158.4, 204.1 163.4, 204.3 168.8 C 204.4 174.3, 205.9 178, 206.3 182 C 206.6 186, 206.6 188.2, 206.2 191.1 C 205.7 194, 205.5 195.5, 203.9 198.2 C 202.3 200.9, 198.5 205, 197.2 206 C 195.8 207.1, 196 206.9, 196.5 204.3 C 197 201.6, 199.5 194, 200.1 191.1 C 200.6 188.2, 199.8 188.9, 199.4 188.1 C 199 187.2, 198.6 186.6, 198.1 186.3 C 197.5 186, 197.3 184.8, 196.2 186.3 C 195 187.8, 192.8 193.5, 191.9 194.6 C 190.9 195.6, 191 194, 191.1 192.1 C 191.2 190.2, 191.3 187.7, 192.4 184 C 193.6 180.4, 198.4 179.3, 197.7 171.9 C 197 164.4, 191.1 152.5, 188.4 142.5 C 185.7 132.5, 184.2 121.1, 182.9 116.2 C 181.5 111.4, 181.7 115.1, 181 115.4 C 180.2 115.8, 179.4 116.6, 178.7 118.2 C 178 119.8, 177.3 121.6, 177 124.3 C 176.7 127, 176.7 128.7, 176.9 133.4 C 177.1 138.1, 177 142.6, 178 150.6 C 179.1 158.6, 181.6 166.5, 182.9 178 C 184.1 189.4, 185.9 201.6, 185 214.4 C 184.1 227.2, 178.7 240.1, 178 248.8 C 177.2 257.6, 180.3 258.4, 180.9 263 C 181.4 267.5, 182.7 264.8, 180.9 274.1 C 179 283.4, 171.9 304.6, 170.5 314.6 C 169.1 324.6, 171.8 326, 173 329.8 C 174.2 333.6, 176.2 334.2, 177.1 335.9 C 178 337.5, 178.1 337.9, 177.9 338.9 C 177.7 339.9, 178.4 340.4, 175.9 341.6 C 173.3 342.8, 166.5 345.2, 163.8 345.8 C 161 346.3, 161.7 345.3, 160.8 344.6 C 160 343.9, 159.6 344.8, 159.1 342 C 158.5 339.1, 157.9 331.9, 157.7 328.8 C 157.5 325.7, 157.1 327.8, 157.8 324.7 C 158.5 321.6, 161 315.6, 161.7 311.6 C 162.4 307.6, 162.1 305.9, 161.6 302.5 C 161.1 299, 159.3 295.3, 158.8 292.3 C 158.3 289.4, 158.7 289.6, 158.7 286.3 C 158.7 283, 158.3 278.7, 158.8 274.1 C 159.3 269.6, 162.4 268.3, 161.7 261 C 161 253.7, 156.4 242, 154.8 233.6 C 153.1 225.2, 153.2 222.8, 152.6 214.4 C 152.1 206, 152.1 192.5, 151.6 187.1 C 151.1 181.6, 150.6 184.3, 150 184.3 C 149.4 184.3, 148.9 181.6, 148.4 187.1 C 147.9 192.5, 147.9 206, 147.4 214.4 C 146.8 222.8, 146.9 225.2, 145.2 233.6 C 143.6 242, 139 253.7, 138.3 261 C 137.6 268.3, 140.7 269.6, 141.2 274.1 C 141.7 278.7, 141.3 283, 141.3 286.3 C 141.3 289.6, 141.7 289.4, 141.2 292.3 C 140.7 295.3, 138.9 299, 138.4 302.5 C 137.9 305.9, 137.6 307.6, 138.3 311.6 C 139 315.6, 141.5 321.6, 142.2 324.7 C 142.9 327.8, 142.5 325.7, 142.3 328.8 C 142.1 331.9, 141.5 339.1, 140.9 342 C 140.4 344.8, 140 343.9, 139.2 344.6 C 138.3 345.3, 139 346.3, 136.2 345.8 C 133.5 345.2, 126.7 342.8, 124.1 341.6 C 121.6 340.4, 122.3 339.9, 122.1 338.9 C 121.9 337.9, 122 337.5, 122.9 335.9 C 123.8 334.2, 125.8 333.6, 127 329.8 C 128.2 326, 130.9 324.6, 129.5 314.6 C 128.1 304.6, 121 283.4, 119.1 274.1 C 117.3 264.8, 118.6 267.5, 119.1 263 C 119.7 258.4, 122.8 257.6, 122 248.8 C 121.3 240.1, 115.9 227.2, 115 214.4 C 114.1 201.6, 115.9 189.4, 117.1 178 C 118.4 166.5, 120.9 158.6, 122 150.6 C 123 142.6, 122.9 138.1, 123.1 133.4 C 123.3 128.7, 123.3 127, 123 124.3 C 122.7 121.6, 122 119.8, 121.3 118.2 C 120.6 116.6, 119.8 115.8, 119 115.4 C 118.3 115.1, 118.5 111.4, 117.1 116.2 C 115.8 121.1, 114.3 132.5, 111.6 142.5 C 108.9 152.5, 103 164.4, 102.3 171.9 C 101.6 179.3, 106.4 180.4, 107.6 184 C 108.7 187.7, 108.8 190.2, 108.9 192.1 C 109 194, 109.1 195.6, 108.1 194.6 C 107.2 193.5, 105 187.8, 103.8 186.3 C 102.7 184.8, 102.5 186, 101.9 186.3 C 101.4 186.6, 101 187.2, 100.6 188.1 C 100.2 188.9, 99.4 188.2, 99.9 191.1 C 100.5 194, 103 201.6, 103.5 204.3 C 104 206.9, 104.2 207.1, 102.8 206 C 101.5 205, 97.7 200.9, 96.1 198.2 C 94.5 195.5, 94.3 194, 93.8 191.1 C 93.4 188.2, 93.4 186, 93.7 182 C 94.1 178, 95.6 174.3, 95.7 168.8 C 95.9 163.4, 94.6 158.4, 94.8 151.6 C 95 144.9, 95.6 139.6, 96.9 131.4 C 98.1 123.2, 101 113.4, 101.7 106.1 C 102.4 98.8, 100.7 94.5, 100.8 90.9 C 100.9 87.2, 100.7 88.1, 102.2 85.8 C 103.6 83.5, 103.9 81.1, 108.9 78.1 C 114 75, 125 71.7, 130.2 68.9 C 135.4 66.1, 136.3 64.4, 137.9 62.5 C 139.5 60.7, 139.1 60.5, 139.3 58.5 C 139.5 56.5, 140.1 54.3, 138.9 51.4 C 137.7 48.5, 133.9 44.7, 132.5 42.3 C 131.2 39.9, 130.9 39.7, 131.3 38.3 C 131.7 36.8, 134 35.8, 134.8 34.2 C 135.5 32.5, 134.9 31.1, 135.6 29.1 C 136.2 27.1, 137 24.8, 138.4 23.1 C 139.8 21.4, 141.2 20.7, 143.3 19.8 C 145.4 18.9, 147.6 18, 150 18 Z';

  return (
    <section className="bg-canvas-card rounded-card p-[clamp(16px,3vw,28px)] flex flex-col items-center gap-5">
      <div className="relative w-full max-w-[560px] h-[494px]">
        {/* Anatomical Human Body SVG (bioimpedance standing posture) */}
        <svg
          viewBox="0 0 300 370"
          className="w-[292px] h-[360px] max-w-full absolute left-1/2 top-6 -translate-x-1/2 overflow-visible"
          role="img"
          aria-label="Diagrama interativo de bioimpedância corporal"
        >
          <defs>
            <linearGradient id="bodySculptFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F1EFE8" stopOpacity="0.95" />
              <stop offset="48%" stopColor="#DCE3D2" stopOpacity="0.58" />
              <stop offset="100%" stopColor="#E4E1D7" stopOpacity="0.88" />
            </linearGradient>
            <radialGradient id="zoneHighlightSage" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#99AA84" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#99AA84" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="zoneHighlightSand" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D6CDB8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#D6CDB8" stopOpacity="0" />
            </radialGradient>
            <clipPath id="bodySilhouetteClip">
              <path d={bodySilhouettePath} />
            </clipPath>
          </defs>

          {/* Bioimpedance scale base rings */}
          <ellipse
            cx="150"
            cy="346"
            rx="72"
            ry="11"
            fill="#DCE3D2"
            fillOpacity="0.45"
            stroke="#B5C2A3"
            strokeWidth="1.1"
          />
          <ellipse
            cx="150"
            cy="346"
            rx="46"
            ry="6.5"
            fill="none"
            stroke="#99AA84"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.75"
          />

          {/* Main sculpted body silhouette */}
          <path
            d={bodySilhouettePath}
            fill="url(#bodySculptFill)"
            stroke="#454A42"
            strokeWidth="1.35"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Subtle contextual anatomical zone highlight clipped inside body */}
          <g clipPath="url(#bodySilhouetteClip)" className="pointer-events-none">
            {activeId === 'fat' && (
              <ellipse cx="106" cy="130" rx="28" ry="40" fill="url(#zoneHighlightSand)" />
            )}
            {activeId === 'muscle' && (
              <ellipse cx="150" cy="108" rx="48" ry="30" fill="url(#zoneHighlightSage)" />
            )}
            {activeId === 'visceral' && (
              <>
                <ellipse cx="150" cy="148" rx="28" ry="24" fill="url(#zoneHighlightSand)" />
                <circle
                  cx="150"
                  cy="148"
                  r="13"
                  fill="none"
                  stroke="#99AA84"
                  strokeWidth="0.9"
                  strokeDasharray="2 3"
                  opacity="0.75"
                />
              </>
            )}
            {activeId === 'water' && (
              <ellipse cx="150" cy="226" rx="44" ry="48" fill="url(#zoneHighlightSage)" />
            )}
            {activeId === 'bmr' && (
              <ellipse cx="150" cy="136" rx="34" ry="52" fill="url(#zoneHighlightSage)" />
            )}
          </g>

          {/* Subtle anatomical midline */}
          <path
            d="M 150 74 V 176"
            stroke="#99AA84"
            strokeWidth="0.95"
            strokeDasharray="2 5"
            opacity="0.7"
            className="pointer-events-none"
          />

          {/* Interactive zone dots */}
          {callouts.map((c) => {
            const isActive = c.id === activeId;
            return (
              <g
                key={c.id}
                onClick={() => setActiveId(c.id)}
                onMouseEnter={() => setActiveId(c.id)}
                className="cursor-pointer"
              >
                {isActive && (
                  <>
                    <circle
                      cx={c.dotCx}
                      cy={c.dotCy}
                      r="12"
                      fill="#B5C2A3"
                      opacity="0.32"
                    />
                    <circle
                      cx={c.dotCx}
                      cy={c.dotCy}
                      r="7.5"
                      fill="none"
                      stroke="#4F6340"
                      strokeWidth="1"
                      opacity="0.65"
                    />
                  </>
                )}
                <circle
                  cx={c.dotCx}
                  cy={c.dotCy}
                  r={isActive ? 4.6 : 3.6}
                  fill={isActive ? '#4F6340' : '#99AA84'}
                  stroke="#F6F5F0"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive Callout Cards */}
        {callouts.map((co) => {
          const isActive = co.id === activeId;
          return (
            <button
              key={co.id}
              type="button"
              onClick={() => setActiveId(co.id)}
              onMouseEnter={() => setActiveId(co.id)}
              className={`absolute ${co.positionClass} bg-canvas rounded-[14px] px-[14px] py-[10px] flex flex-col gap-[2px] min-w-[108px] text-left cursor-pointer border-[1.5px] transition-colors ${
                isActive
                  ? 'border-sage-mid bg-canvas-subtle'
                  : 'border-transparent hover:border-sage'
              }`}
            >
              <span className="text-[11px] text-ink-muted font-semibold tracking-[0.04em] uppercase">
                {co.label}
              </span>
              <span className="text-[19px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {co.value}
                <span className="text-[12px] text-ink-muted font-medium ml-[3px]">
                  {co.unit}
                </span>
              </span>
              <span className="text-[11px] text-ink-sageStrong font-medium">{co.note}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Callout Detail Banner */}
      <div className="w-full max-w-[560px] bg-canvas rounded-[14px] px-4 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-ink-sageStrong">
            {activeCallout.label}
          </span>
          <span className="text-[12px] font-semibold text-ink tabular-nums">
            {activeCallout.value} {activeCallout.unit}
          </span>
        </div>
        <p className="m-0 text-[13px] text-ink-secondary leading-[1.5] tabular-nums">
          {activeCallout.detail}
        </p>
      </div>
    </section>
  );
};
