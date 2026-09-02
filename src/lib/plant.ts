export interface PlantBand {
  name: string;
  min: number;
  max: number;
  haiku: string;
}

export const PLANT_BANDS: PlantBand[] = [
  { name: 'Seed', min: 0, max: 10, haiku: 'A quiet seed, holding a whole forest of intention.' },
  { name: 'Sprout', min: 10, max: 28, haiku: 'First green reach toward a wide, waiting sky.' },
  { name: 'Young Sapling', min: 28, max: 62, haiku: 'Stretching limbs, finding its own quiet rhythm.' },
  { name: 'Maturing Tree', min: 62, max: 120, haiku: 'Roots run deep, a canopy beginning to gather light.' },
  { name: 'Full Tree', min: 120, max: 220, haiku: 'A living sanctuary — shelter, shade, and stillness.' },
];

export const DAILY_WATER_CAP = 18;

export interface WaterEvent {
  id: string;
  label: string;
  points: number;
  whenMin?: number;
  whenLabel?: string;
}

export function pointsForTimeLog(mins: number): number {
  return Math.max(1, Math.round(Math.min(mins * 0.4, 16)));
}

export function pointsForFocus(mins: number): number {
  return 6 + Math.round(Math.min(mins * 0.08, 6));
}

export const STARS_COORDINATES: Array<[number, number, number, number]> = [
  [12, 18, 1.6, 0.55],
  [34, 46, 1.1, 0.4],
  [58, 12, 2, 0.7],
  [72, 34, 1.3, 0.45],
  [88, 22, 1.7, 0.6],
  [22, 62, 1.2, 0.3],
  [46, 28, 1.5, 0.5],
  [64, 58, 1.1, 0.35],
  [82, 66, 1.4, 0.4],
  [8, 40, 1.3, 0.35],
  [93, 44, 1.2, 0.5],
  [40, 8, 1.6, 0.6],
  [70, 8, 1.1, 0.3],
  [28, 34, 1.3, 0.42],
];
