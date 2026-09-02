import React, { useMemo } from 'react';
import { TimeEntry } from '../types';
import { PLANT_BANDS, STARS_COORDINATES, pointsForTimeLog, DAILY_WATER_CAP } from '../lib/plant';
import { fmtTime12 } from '../lib/time';

interface PlantScreenProps {
  entries?: TimeEntry[];
  allEntries?: TimeEntry[];
  todayKey?: string;
  timeZone?: string;
  onLogActivity?: () => void;
}

export const PlantScreen: React.FC<PlantScreenProps> = ({
  entries = [],
  allEntries = [],
  todayKey,
  timeZone,
  onLogActivity,
}) => {
  // Ensure array safety
  const safeAllEntries = allEntries || [];
  const safeEntries = entries || [];

  // Calculate total water points and today's points from real logged entries
  const {
    totalPoints,
    todayPoints,
    currentBand,
    nextBand,
    progressPct,
    pointsToGo,
    waterEvents,
    dayIndex,
    seasonName,
  } = useMemo(() => {
    let pts = 0;
    let todayPts = 0;
    const events: Array<{
      id: string;
      activityName: string;
      categoryColor: string;
      points: number;
      whenLabel: string;
    }> = [];

    // Calculate points from all entries
    safeAllEntries.forEach((e) => {
      const mins = Math.round(e.durationSec / 60);
      const earned = pointsForTimeLog(mins);
      pts += earned;

      events.push({
        id: e.id,
        activityName: e.activityName,
        categoryColor: e.categoryColor || '#38BDF8',
        points: earned,
        whenLabel: fmtTime12(e.endedAtMs, timeZone),
      });
    });

    // Calculate today's points
    safeEntries.forEach((e) => {
      const mins = Math.round(e.durationSec / 60);
      todayPts += pointsForTimeLog(mins);
    });
    todayPts = Math.min(DAILY_WATER_CAP, todayPts);

    // Determine plant stage band
    let band = PLANT_BANDS[0];
    for (const b of PLANT_BANDS) {
      if (pts >= b.min) {
        band = b;
      }
    }

    const bandIndex = PLANT_BANDS.indexOf(band);
    const nxt = bandIndex < PLANT_BANDS.length - 1 ? PLANT_BANDS[bandIndex + 1] : null;

    const span = (nxt ? nxt.min : band.max) - band.min;
    const currentInBand = pts - band.min;
    const pct = Math.min(100, Math.max(0, Math.round((currentInBand / Math.max(1, span)) * 100)));
    const ptsRemaining = nxt ? Math.max(0, nxt.min - pts) : 0;

    // Calculate season name based on current month
    const month = new Date().getMonth(); // 0-11
    let season = 'AUTUMN';
    if (month >= 2 && month <= 4) season = 'SPRING';
    else if (month >= 5 && month <= 7) season = 'SUMMER';
    else if (month >= 8 && month <= 10) season = 'AUTUMN';
    else season = 'WINTER';

    // Day index
    const dayIdx = Math.max(0, new Set(safeAllEntries.map((e) => e.localDate)).size - 1);

    return {
      totalPoints: pts,
      todayPoints: todayPts,
      currentBand: band,
      nextBand: nxt,
      progressPct: pct,
      pointsToGo: ptsRemaining,
      waterEvents: events.reverse().slice(0, 10),
      dayIndex: dayIdx,
      seasonName: season,
    };
  }, [safeAllEntries, safeEntries, timeZone]);

  return (
    <div className="flex flex-col gap-6 pb-8 tf-rise select-none">
      {/* Hero Plant Sanctuary Card */}
      <div
        className="relative w-full h-[360px] sm:h-[390px] rounded-[32px] overflow-hidden flex flex-col justify-between p-6 select-none shadow-2xl transition-all"
        style={{
          background: 'radial-gradient(120% 120% at 50% 10%, #102636 0%, #0c1c28 45%, #08131d 100%)',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Subtle Ambient Twinkling Stars */}
        {STARS_COORDINATES.map(([left, top, size, opacity], idx) => (
          <div
            key={idx}
            className="absolute rounded-full tf-pulse pointer-events-none"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${Math.max(1.5, size * 1.3)}px`,
              height: `${Math.max(1.5, size * 1.3)}px`,
              background: '#E2F1FF',
              opacity: opacity * 0.85,
              boxShadow: '0 0 4px rgba(226, 241, 255, 0.8)',
              animationDelay: `${idx * 0.4}s`,
            }}
          />
        ))}

        {/* Soft Ambient Radial Plant Aura */}
        <div
          className="absolute w-[260px] h-[260px] rounded-full tf-breathe pointer-events-none"
          style={{
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.22) 0%, rgba(16, 185, 129, 0.12) 40%, rgba(14, 165, 233, 0.04) 70%, transparent 85%)',
          }}
        />

        {/* Card Header (Top Left) */}
        <div className="z-10 flex flex-col items-start gap-1">
          <span
            style={{
              font: "600 10.5px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(226, 241, 255, 0.55)',
            }}
          >
            DAY {dayIndex} · {seasonName}
          </span>
          <h2
            style={{
              font: '700 32px/1.05 Archivo, sans-serif',
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
            }}
          >
            {currentBand.name}
          </h2>
        </div>

        {/* Organic Stylized Plant SVG Artwork */}
        <div className="relative w-full h-[190px] flex items-end justify-center tf-sway z-10 -mb-2">
          <svg viewBox="0 0 200 180" className="w-[180px] h-[180px] overflow-visible">
            <defs>
              <linearGradient id="plantStemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              <linearGradient id="plantLeafGradLeft" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>

              <linearGradient id="plantLeafGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="50%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <filter id="plantGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Earth mound base */}
            <ellipse
              cx="100"
              cy="172"
              rx="40"
              ry="7"
              fill="rgba(255, 255, 255, 0.05)"
              filter="blur(1px)"
            />

            {currentBand.name === 'Seed' && (
              <g filter="url(#plantGlow)">
                <ellipse cx="100" cy="165" rx="8" ry="11" fill="url(#plantStemGrad)" transform="rotate(-15 100 165)" />
                <circle cx="100" cy="154" r="3" fill="#6EE7B7" />
              </g>
            )}

            {currentBand.name === 'Sprout' && (
              <g filter="url(#plantGlow)">
                {/* Main upright stem */}
                <path
                  d="M 100 170 C 99 140 100 110 100 88"
                  fill="none"
                  stroke="url(#plantStemGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Left flowing leaf */}
                <path
                  d="M 100 155 C 70 155 64 125 100 105 C 80 135 88 152 100 155 Z"
                  fill="url(#plantLeafGradLeft)"
                />

                {/* Right upward reaching leaf */}
                <path
                  d="M 100 135 C 128 132 135 110 100 90 C 120 108 116 130 100 135 Z"
                  fill="url(#plantLeafGradRight)"
                />

                {/* Top sprout tip */}
                <circle cx="100" cy="88" r="3" fill="#6EE7B7" />
              </g>
            )}

            {currentBand.name !== 'Seed' && currentBand.name !== 'Sprout' && (
              <g filter="url(#plantGlow)">
                {/* Main tree stem */}
                <path
                  d="M 100 170 Q 97 125 100 75 Q 102 50 100 35"
                  fill="none"
                  stroke="url(#plantStemGrad)"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Lower Left Leaf */}
                <path
                  d="M 99 152 C 68 152 62 122 99 104 C 78 133 86 149 99 152 Z"
                  fill="url(#plantLeafGradLeft)"
                />
                {/* Lower Right Leaf */}
                <path
                  d="M 100 132 C 130 130 136 106 100 88 C 122 105 118 127 100 132 Z"
                  fill="url(#plantLeafGradRight)"
                />
                {/* Upper Left Leaf */}
                <path
                  d="M 99 105 C 72 102 70 80 99 68 C 82 86 86 100 99 105 Z"
                  fill="url(#plantLeafGradLeft)"
                />
                {/* Upper Right Leaf */}
                <path
                  d="M 100 85 C 126 80 128 62 100 50 C 118 64 115 78 100 85 Z"
                  fill="url(#plantLeafGradRight)"
                />
                {/* Luminous Crown Node */}
                <circle cx="100" cy="35" r="4.5" fill="#FDE68A" />
              </g>
            )}
          </svg>
        </div>

        {/* Card Footer Caption (Italic Serif) */}
        <p
          className="z-10 text-center italic leading-relaxed"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '16.5px',
            color: 'rgba(226, 241, 255, 0.72)',
          }}
        >
          {currentBand.haiku}
        </p>
      </div>

      {/* Toward Next Stage Progress Section */}
      <div className="flex flex-col gap-2.5 px-0.5">
        <div className="flex items-center justify-between">
          <span
            style={{
              font: "600 10.5px/1 'JetBrains Mono', monospace",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(var(--tf-ink-rgb), 0.50)',
            }}
          >
            {nextBand ? `TOWARD ${nextBand.name.toUpperCase()}` : 'SANCTUARY IN FULL BLOOM'}
          </span>
          <span
            style={{
              font: "500 11px/1 'JetBrains Mono', monospace",
              color: 'rgba(var(--tf-ink-rgb), 0.55)',
            }}
          >
            {nextBand ? `${pointsToGo} pts to go` : 'Max stage'}
          </span>
        </div>

        {/* Glowing Sleek Progress Track */}
        <div
          className="w-full h-[6px] rounded-full overflow-hidden"
          style={{
            background: 'rgba(var(--tf-surf-rgb), 0.10)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #2DD4BF 0%, #34D399 100%)',
              boxShadow: '0 0 10px rgba(45, 212, 191, 0.5)',
            }}
          />
        </div>

        {/* Growth Philosophy Note */}
        <p
          className="text-[12px] leading-relaxed pt-1"
          style={{
            font: '400 12px/1.55 Archivo, sans-serif',
            color: 'rgba(var(--tf-ink-rgb), 0.52)',
          }}
        >
          Growth is earned through logged time, finished focus and reflection — never through taps. Today it drank {todayPoints} of {DAILY_WATER_CAP} possible points.
        </p>
      </div>

      {/* Water Log Section */}
      <div className="flex flex-col gap-3 px-0.5 pt-1">
        <span
          style={{
            font: "600 10px/1 'JetBrains Mono', monospace",
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(var(--tf-ink-rgb), 0.42)',
          }}
        >
          WATER LOG
        </span>

        {waterEvents.length === 0 ? (
          <div
            className="flex items-center justify-center p-6 rounded-2xl text-center"
            style={{
              background: 'rgba(var(--tf-surf-rgb), 0.03)',
              border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
            }}
          >
            <p
              className="text-xs italic"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '15px',
                color: 'rgba(var(--tf-ink-rgb), 0.45)',
              }}
            >
              No water events recorded yet. Focused blocks water your plant automatically.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {waterEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: 'rgba(var(--tf-surf-rgb), 0.04)',
                  border: '1px solid rgba(var(--tf-surf-rgb), 0.08)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: evt.categoryColor || '#38BDF8',
                      boxShadow: `0 0 8px ${evt.categoryColor || '#38BDF8'}`,
                    }}
                  />
                  <span
                    style={{
                      font: '600 13.5px/1.2 Archivo, sans-serif',
                      color: 'var(--tf-ink)',
                    }}
                    className="truncate"
                  >
                    {evt.activityName}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                  <span
                    style={{
                      font: "400 11px/1 'JetBrains Mono', monospace",
                      color: 'rgba(var(--tf-ink-rgb), 0.40)',
                    }}
                  >
                    {evt.whenLabel}
                  </span>
                  <span
                    style={{
                      font: "700 13px/1 'JetBrains Mono', monospace",
                      color: '#2DD4BF',
                    }}
                  >
                    +{evt.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

