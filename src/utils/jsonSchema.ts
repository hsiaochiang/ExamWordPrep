export type SelectionType = 'pageRange' | 'frequency' | 'alphabet' | 'customList';
export type QuizMode = 'enToZh' | 'zhToEn';
export type Familiarity = 'unmarked' | 'known' | 'unknown';

export interface WordDefinition {
  pos: string;
  meaningZh: string;
}

export interface WordItem {
  id: number;
  word: string;
  posList: WordDefinition[];
  frequencyGroup: number[];
  frequencyCount: number;
  page: number;
  needsReview: boolean;
  status: string;
}

export function getPosDisplay(word: WordItem): string {
  if (!word.posList || word.posList.length === 0) return '';
  return word.posList.map(item => item.pos).join('、');
}

export function getMeaningDisplay(word: WordItem): string {
  if (!word.posList || word.posList.length === 0) return '';
  return word.posList.map(item => item.meaningZh).join('；');
}

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SelectionCondition {
  type: SelectionType;
  pages?: [number, number];
  frequencyGroup?: number | null;
  alphabetRange?: [string, string];
  customWords?: string[];
}

export interface QuizRecord {
  mode: QuizMode;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
}

export interface RecordItem {
  username: string;
  sessionId: string;
  createdAt: string;
  selectionCondition: SelectionCondition;
  wordCount: number;
  quiz: QuizRecord;
  wrongWords: string[];
}

export interface UserSettings {
  username: string;
  maxWordsPerSession: number;
  defaultSelectionType: SelectionType;
  defaultQuizMode: QuizMode;
  defaultTtsMode: 'wordOnly' | 'wordAndMeaning';
  defaultTtsIntervalSec: number;
}

export interface AppData {
  users: User[];
  records: RecordItem[];
  userSettings: UserSettings[];
}
