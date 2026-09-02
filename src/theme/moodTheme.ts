export type MoodVibeKey = 'serene-navy' | 'deep-flow' | 'radiant-amber' | 'mindful-sage' | 'dusk-violet' | 'quiet-hearth';

export interface MoodVibe {
  key: MoodVibeKey;
  name: string;
  emoji: string;
  tagline: string;
  accentColor: string; // Key accent
  secondaryAccent: string;
  glowColors: [string, string, string]; // Top-left, top-right, bottom-left ambient glow
  atmosphereTint: string; // Subtle backdrop overlay tint
  ratingEquivalent: number; // 1-5 equivalent
}

export const MOOD_VIBES: Record<MoodVibeKey, MoodVibe> = {
  'serene-navy': {
    key: 'serene-navy',
    name: 'Serene Twilight',
    emoji: '🌌',
    tagline: 'Deep calm, clear mind & quiet presence',
    accentColor: '#38BDF8', // Luminous Sky Blue
    secondaryAccent: '#1E3A8A', // Deep Navy
    glowColors: ['#1E3A8A', '#0284C7', '#38BDF8'],
    atmosphereTint: 'rgba(14, 28, 54, 0.4)',
    ratingEquivalent: 5,
  },
  'deep-flow': {
    key: 'deep-flow',
    name: 'Deep Flow',
    emoji: '⚡',
    tagline: 'Focused, immersed & effortlessly productive',
    accentColor: '#60A5FA', // Mineral Blue
    secondaryAccent: '#4F46E5', // Indigo
    glowColors: ['#312E81', '#2563EB', '#60A5FA'],
    atmosphereTint: 'rgba(30, 27, 75, 0.4)',
    ratingEquivalent: 4,
  },
  'radiant-amber': {
    key: 'radiant-amber',
    name: 'Radiant Vitality',
    emoji: '✨',
    tagline: 'Warm energy, joyful movement & gratitude',
    accentColor: '#F59E0B', // Amber
    secondaryAccent: '#D97706', // Warm Ochre
    glowColors: ['#B45309', '#F59E0B', '#FBBF24'],
    atmosphereTint: 'rgba(69, 26, 3, 0.35)',
    ratingEquivalent: 5,
  },
  'mindful-sage': {
    key: 'mindful-sage',
    name: 'Mindful Grounding',
    emoji: '🌿',
    tagline: 'Rooted, restorative & connected to baseline',
    accentColor: '#34D399', // Sage Emerald
    secondaryAccent: '#059669', // Deep Forest
    glowColors: ['#064E3B', '#10B981', '#34D399'],
    atmosphereTint: 'rgba(6, 78, 59, 0.35)',
    ratingEquivalent: 4,
  },
  'dusk-violet': {
    key: 'dusk-violet',
    name: 'Dusk Sanctuary',
    emoji: '🌙',
    tagline: 'Gentle wind-down, reflection & deep rest',
    accentColor: '#A78BFA', // Soft Lavender
    secondaryAccent: '#6D28D9', // Deep Violet
    glowColors: ['#4C1D95', '#7C3AED', '#C4B5FD'],
    atmosphereTint: 'rgba(76, 29, 149, 0.35)',
    ratingEquivalent: 5,
  },
  'quiet-hearth': {
    key: 'quiet-hearth',
    name: 'Quiet Contemplation',
    emoji: '🕯️',
    tagline: 'Gentle pacing, intentionality & peace',
    accentColor: '#FB923C', // Soft Terracotta
    secondaryAccent: '#9A3412', // Deep Rust
    glowColors: ['#7C2D12', '#EA580C', '#FED7AA'],
    atmosphereTint: 'rgba(124, 45, 18, 0.35)',
    ratingEquivalent: 3,
  },
};

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'twentyfour_theme_mode_v2';
const MOOD_STORAGE_KEY = 'twentyfour_active_mood_v2';

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark'; // Dark is primary and default flagship aesthetic
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    if (typeof document !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }
    }
  } catch {}
}

export function getStoredMoodVibe(): MoodVibeKey {
  try {
    const saved = localStorage.getItem(MOOD_STORAGE_KEY) as MoodVibeKey;
    if (saved && MOOD_VIBES[saved]) return saved;
  } catch {}
  return 'serene-navy'; // Default to serene navy
}

export function setStoredMoodVibe(key: MoodVibeKey): void {
  try {
    localStorage.setItem(MOOD_STORAGE_KEY, key);
  } catch {}
}

export function moodVibeFromRating(rating?: number): MoodVibeKey {
  if (!rating || rating >= 5) return 'serene-navy';
  if (rating === 4) return 'deep-flow';
  if (rating === 3) return 'mindful-sage';
  if (rating === 2) return 'quiet-hearth';
  return 'dusk-violet';
}

export const themeEngine = {
  getStoredTheme,
  applyTheme: (mode: ThemeMode) => setStoredTheme(mode),
  getStoredMoodVibe,
  applyMoodVibe: (key: MoodVibeKey) => {
    setStoredMoodVibe(key);
    const vibe = MOOD_VIBES[key];
    if (vibe && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent-glow', vibe.accentColor);
      document.documentElement.style.setProperty('--atmosphere-tint', vibe.atmosphereTint);
    }
  },
};
