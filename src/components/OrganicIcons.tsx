import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  duotone?: boolean;
}

/** Zen Lotus Emblem: delicate petals with soft duotone aura */
export const ZenLotusIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <>
        <path
          d="M12 4C10.5 8 9.5 12 12 17C14.5 12 13.5 8 12 4Z"
          fill="currentColor"
          fillOpacity={0.22}
        />
        <path
          d="M12 17C7.5 16 4.5 12 5.5 8.5C7.5 12 10 15 12 17Z"
          fill="currentColor"
          fillOpacity={0.14}
        />
        <path
          d="M12 17C16.5 16 19.5 12 18.5 8.5C16.5 12 14 15 12 17Z"
          fill="currentColor"
          fillOpacity={0.14}
        />
      </>
    )}
    <path
      d="M12 3.5C10.5 7.5 9.5 11.5 12 17.5C14.5 11.5 13.5 7.5 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17.5C7 16.5 4 12.5 5 8.5C7.2 12 10 15.2 12 17.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 17.5C17 16.5 20 12.5 19 8.5C16.8 12 14 15.2 12 17.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 18C7.5 19.5 16.5 19.5 19.5 18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="12" cy="18.5" r="1" fill="currentColor" />
  </svg>
);

/** 24h Clock Aura with soft rotating rays and gentle clock hands */
export const ClockAuraIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity={0.15} />
    )}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M12 6.5V12L15.5 14.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path
      d="M12 2.5V3.5M21.5 12H20.5M12 20.5V21.5M3.5 12H2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Concentric Rhythm Rings: Oura-inspired triple readiness curve */
export const RhythmRingsIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity={0.2} />
    )}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeDasharray="4 2"
    />
    <circle
      cx="12"
      cy="12"
      r="6.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/** Moon Rest: Hand-drawn crescent cradling a gentle star */
export const MoonRestIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M19.5 13.5C18.5 18 14.5 20.5 10 20C5.5 19.5 2 15.5 2.5 11C3 6.5 6.5 3 11 3C10 5.5 10.5 8.5 12.5 10.5C14.5 12.5 17.5 13 19.5 13.5Z"
        fill="currentColor"
        fillOpacity={0.18}
      />
    )}
    <path
      d="M20 13.5C19 18 15 20.5 10.5 20C6 19.5 2.5 15.5 3 11C3.5 6.5 7 3 11.5 3C10.5 5.5 11 8.5 13 10.5C15 12.5 18 13 20 13.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.5 4.5L18.2 6.2L20 6.5L18.5 7.8L19 9.5L17.5 8.5L16 9.5L16.5 7.8L15 6.5L16.8 6.2L17.5 4.5Z"
      fill="currentColor"
      fillOpacity={0.3}
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Sun Radiance: Organic wavy rays and luminous center */
export const SunRadianceIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity={0.2} />
    )}
    <circle
      cx="12"
      cy="12"
      r="5.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M12 2.5V4.5M12 19.5V21.5M2.5 12H4.5M19.5 12H21.5M5.2 5.2L6.8 6.8M17.2 17.2L18.8 18.8M5.2 18.8L6.8 17.2M17.2 6.8L18.8 5.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Journal Book / Evening Quill */
export const JournalBookIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M4 19.5C4 18.1 5.1 17 6.5 17H20V4H6.5C5.1 4 4 5.1 4 6.5V19.5Z"
        fill="currentColor"
        fillOpacity={0.15}
      />
    )}
    <path
      d="M4 19.5C4 18.1 5.1 17 6.5 17H20V4H6.5C5.1 4 4 5.1 4 6.5V19.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 19.5C4 20.9 5.1 22 6.5 22H20V17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 8.5H15.5M8.5 12.5H13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Shield Cap / Intentional Protection */
export const ShieldCapIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M12 3L4 6.5V12C4 16.5 7.5 20.5 12 21.5C16.5 20.5 20 16.5 20 12V6.5L12 3Z"
        fill="currentColor"
        fillOpacity={0.16}
      />
    )}
    <path
      d="M12 3L4 6.5V12C4 16.5 7.5 20.5 12 21.5C16.5 20.5 20 16.5 20 12V6.5L12 3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 12L11.5 14L15 9.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Target Rhythm / Target Compass */
export const TargetRhythmIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity={0.2} />
    )}
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle
      cx="12"
      cy="12"
      r="5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <path
      d="M12 2V5M12 19V22M2 12H5M19 12H22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const TargetCompassIcon = TargetRhythmIcon;

/** Sparkle Aura / Atmosphere */
export const SparkleAuraIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"
        fill="currentColor"
        fillOpacity={0.2}
      />
    )}
    <path
      d="M12 2.5C12 7.5 16.5 12 21.5 12C16.5 12 12 16.5 12 21.5C12 16.5 7.5 12 2.5 12C7.5 12 12 7.5 12 2.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="19" cy="5" r="1.2" fill="currentColor" />
    <circle cx="5" cy="19" r="1" fill="currentColor" />
  </svg>
);

/** Drop / Mindful Breath */
export const DropBreathIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M12 3C12 3 5 11.5 5 16C5 19.8 8.1 22 12 22C15.9 22 19 19.8 19 16C19 11.5 12 3 12 3Z"
        fill="currentColor"
        fillOpacity={0.18}
      />
    )}
    <path
      d="M12 3.5C12 3.5 5.5 11.5 5.5 16C5.5 19.5 8.4 21.5 12 21.5C15.6 21.5 18.5 19.5 18.5 16C18.5 11.5 12 3.5 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 15.5C9.5 17.5 10.5 19 12.5 19"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

/** Flame Focus / Deep Work */
export const FlameFocusIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M12 3C12 7 7 9.5 7 14.5C7 18.5 10 21.5 14 21.5C17.5 21.5 20 18.5 20 15C20 10.5 16 7.5 16 3C14 5.5 14 7.5 12 3Z"
        fill="currentColor"
        fillOpacity={0.2}
      />
    )}
    <path
      d="M12 3.5C12 7.5 7.5 10 7.5 14.5C7.5 18.5 10.5 21.5 14.5 21.5C18 21.5 20.5 18.5 20.5 15C20.5 10.5 16.5 7.5 16.5 3.5C14.5 6 14 7.5 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 14C12 16.5 13.5 18 15 18"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

/** Sound Chime / Acoustic Bowl */
export const SoundChimeIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M4 11C4 16 7.5 19 12 19C16.5 19 20 16 20 11H4Z"
        fill="currentColor"
        fillOpacity={0.2}
      />
    )}
    <path
      d="M4 11C4 16 7.5 19 12 19C16.5 19 20 16 20 11H4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 4V8M8 5L9 8M16 5L15 8M9 21H15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Layers Balance / Stacking Stones */
export const LayersBalanceIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <>
        <ellipse cx="12" cy="18" rx="8" ry="3" fill="currentColor" fillOpacity={0.16} />
        <ellipse cx="12" cy="12" rx="6" ry="2.5" fill="currentColor" fillOpacity={0.2} />
        <ellipse cx="12" cy="6.5" rx="4" ry="2" fill="currentColor" fillOpacity={0.24} />
      </>
    )}
    <ellipse cx="12" cy="18" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="12" cy="12" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="12" cy="6.5" rx="4" ry="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Heart Rhythm / Pulse */
export const HeartPulseIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill="currentColor"
        fillOpacity={0.18}
      />
    )}
    <path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 12H9.5L11 9L13 15L14.5 12H17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Calendar Rhythm */
export const CalendarRhythmIcon: React.FC<IconProps> = ({ size = 20, className = '', duotone = true, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    {duotone && (
      <rect x="3" y="4" width="18" height="17" rx="3" fill="currentColor" fillOpacity={0.15} />
    )}
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 2V5M16 2V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="13" r="1" fill="currentColor" />
    <circle cx="12" cy="13" r="1" fill="currentColor" />
    <circle cx="16" cy="13" r="1" fill="currentColor" />
    <circle cx="8" cy="17" r="1" fill="currentColor" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
    <circle cx="16" cy="17" r="1" fill="currentColor" />
  </svg>
);
