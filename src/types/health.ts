export type ScreenId = 'overview' | 'labs' | 'body';

export type BiomarkerStatus = 'optimal' | 'borderline' | 'out';

export type BiomarkerCategory =
  | 'Todos'
  | 'Lipídios'
  | 'Metabólico'
  | 'Renal e Hepático'
  | 'Vitaminas'
  | 'Hormônios'
  | 'Hemograma';

export type ConcreteCategory = Exclude<BiomarkerCategory, 'Todos'>;

export interface BiomarkerPoint {
  date: string;
  isoDate: string;
  value: number;
  lab?: string;
}

export interface BiomarkerInsight {
  title: string;
  body: string;
}

export interface Biomarker {
  id: string;
  name: string;
  category: ConcreteCategory;
  unit: string;
  value: number;
  lo: number;
  hi: number;
  min: number;
  max: number;
  status: BiomarkerStatus;
  history: BiomarkerPoint[];
  desc: string;
  tip?: string;
  insights?: BiomarkerInsight[];
  refLabel?: string;
}

export interface LabExamRecord {
  id: string;
  date: string;
  isoDate: string;
  lab: string;
  doctor: string;
  fileName: string;
  fileUrl?: string;
  markerCount: number;
}

export interface SegmentMetric {
  muscleKg: number;
  fatKg: number;
  fatPct: number;
}

export interface SegmentalData {
  trunk: SegmentMetric;
  leftArm: SegmentMetric;
  rightArm: SegmentMetric;
  leftLeg: SegmentMetric;
  rightLeg: SegmentMetric;
}

export interface BioimpedanceEntry {
  id: string;
  monthLabel: string;
  date: string;
  isoDate: string;
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
  muscleMassKg: number;
  muscleMassPct: number;
  visceralFat: number;
  waterPct: number;
  boneMassKg: number;
  bmrKcal: number;
  sarcopeniaIndex?: number;
  segmental?: SegmentalData;
}

export interface UserProfile {
  name: string;
  firstName: string;
  initials: string;
  age: number;
  gender: 'M' | 'F';
  heightCm: number;
  birthDate: string;
}

export interface ScaleMeasurement {
  id: string;
  date: string;
  isoDate: string;
  time: string;
  monthKey: string;
  monthLabel: string;
  weightKg: number;
  bmi: number;
  bodyFatPct?: number;
  fatMassKg?: number;
  skeletalMusclePct?: number;
  skeletalMuscleKg?: number;
  muscleRatePct?: number;
  muscleMassKg?: number;
  source: 'okok-scale' | 'manual';
}

export interface HealthState {
  profile: UserProfile;
  biomarkers: Biomarker[];
  labExams: LabExamRecord[];
  bioimpedanceHistory: BioimpedanceEntry[];
  scaleHistory: ScaleMeasurement[];
}

export interface ExtractedBiomarkerDraft {
  id: string;
  biomarkerId?: string;
  name: string;
  category: ConcreteCategory;
  value: number;
  unit: string;
  lo: number;
  hi: number;
  min: number;
  max: number;
  selected: boolean;
}

export interface ParsedPdfResult {
  fileName: string;
  detectedLab: string;
  detectedDate: string;
  isoDate: string;
  markers: ExtractedBiomarkerDraft[];
}
