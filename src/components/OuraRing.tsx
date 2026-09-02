import React from 'react';

export interface RingSegment {
  value: number; // 0 to 100
  color: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface ConcentricRingsProps {
  size?: number;
  gap?: number;
  strokeWidth?: number;
  rings: {
    value: number; // 0 to 100
    color: string;
    bgColor?: string;
    strokeWidth?: number;
  }[];
  centerContent?: React.ReactNode;
  className?: string;
}

export const ConcentricRings: React.FC<ConcentricRingsProps> = ({
  size = 180,
  gap = 3.5,
  strokeWidth: defaultStrokeWidth = 8,
  rings,
  centerContent,
  className = '',
}) => {
  const center = size / 2;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id="soft-ring-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {rings.map((ring, idx) => {
          const currentStrokeWidth = ring.strokeWidth || defaultStrokeWidth;
          const radius = center - currentStrokeWidth / 2 - idx * (currentStrokeWidth + gap) - 3;
          if (radius <= 0) return null;

          const circumference = 2 * Math.PI * radius;
          const clampedVal = Math.min(100, Math.max(0, ring.value));
          const offset = circumference - (clampedVal / 100) * circumference;

          return (
            <g key={idx}>
              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.bgColor || 'rgba(255, 255, 255, 0.08)'}
                strokeWidth={currentStrokeWidth}
                strokeLinecap="round"
              />
              {/* Progress Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={currentStrokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                filter={ring.value > 0 ? 'url(#soft-ring-glow)' : undefined}
                style={{
                  transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center Label / Icon / Score */}
      {centerContent && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
  );
};
