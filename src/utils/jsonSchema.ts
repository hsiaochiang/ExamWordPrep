export type SelectionType = 'pageRange' | 'frequency' | 'alphabet' | 'customList';
export type QuizMode = 'enToZh' | 'zhToEn';
export type Familiarity = 'unmarked' | 'known' | 'unknown';

export interface WordItem {
  id: string;
  word: string;
  posRaw: string;
  meaningZh: string;
  frequencyGroup: number;
  page: number;
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
