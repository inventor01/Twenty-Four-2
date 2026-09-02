export type CategoryKind = 'fixed' | 'flexible' | 'rest';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: CategoryKind;
  description?: string;
  isCustom?: boolean;
}

export interface Activity {
  id: string;
  categoryId: string;
  name: string;
  isFavorite: boolean;
  isArchived: boolean;
}

export interface EntryNote {
  id: string;
  text: string;
  createdAtMs: number;
}

export interface TimeEntry {
  id: string;
  activityId: string;
  activityName: string;
  categoryName: string;
  categoryKind: CategoryKind;
  categoryColor: string;
  emoji: string;
  startedAtMs: number;
  endedAtMs: number;
  durationSec: number;
  localDate: string; // YYYY-MM-DD
  note?: string; // Kept for backward compatibility during read
  notes: EntryNote[];
  valueRating?: number;
}

export type TimerMode = 'continuous' | 'pomodoro';

export interface TimerState {
  activityId: string;
  startedAtMs: number;
  accumulatedPauseMs: number;
  pausedAtMs: number | null;
  mode?: TimerMode;
  targetIntervalSec?: number; // e.g., 25 * 60 = 1500
  intervalState?: 'focus' | 'rest';
  completedIntervals?: number;
  notes: EntryNote[];
}

export interface Budget {
  id: string;
  categoryId: string;
  period: 'daily' | 'weekly';
  targetSec: number;
  direction?: 'max' | 'min'; // 'max' (<= limit) or 'min' (>= commitment)
  type?: 'min' | 'max' | 'target';
}

export type IntentionalityBudget = Budget;

export interface DailyReflection {
  dateKey: string;
  question: string;
  answer: string;
  closedAtMs: number;
  moodRating?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt?: string;
  onboardingComplete: boolean;
  intentions?: string[];
  targetSleepHours?: number;
  targetDeepWorkHours?: number;
  primaryFocus?: string;
  settings?: UserSettings;
}

export interface OnboardingAnswers {
  displayName: string;
  primaryFocus: string;
  targetSleepHours: number;
  targetDeepWorkHours: number;
  intentions: string[];
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  defaultFocusMinutes: number;
  timeZone: string; // IANA id, default 'America/New_York'
  hourFormat: 12 | 24; // default 12
  priorityCategoryIds?: string[];
}

export interface CreateCategoryInput {
  name: string;
  emoji: string;
  color: string;
  kind: CategoryKind;
  description?: string;
  isCustom?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  emoji?: string;
  color?: string;
  kind?: CategoryKind;
  description?: string;
}

export type CategoryDeleteStrategy =
  | { mode: 'reassign'; toCategoryId: string }
  | { mode: 'delete-entries' };

export interface CategoryDeleteSummary {
  deletedCategoryId: string;
  strategy: CategoryDeleteStrategy;
  modifiedEntriesCount: number;
  deletedEntriesCount: number;
  modifiedActivitiesCount: number;
  deletedActivitiesCount: number;
  modifiedBudgetsCount: number;
  deletedBudgetsCount: number;
}

export interface DataEnvelope {
  version: 4;
  exportedAt: string;
  categories: Category[];
  activities: Activity[];
  budgets: Budget[];
  entries: TimeEntry[];
  reflections: DailyReflection[];
  settings: UserSettings;
  timer?: TimerState | null;
}
