import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Familiarity, SelectionCondition, UserSettings, WordItem } from '../utils/jsonSchema';
import { useAuth } from './AuthContext';

type WordSetContextValue = {
  words: WordItem[];
  loading: boolean;
  selection: SelectionCondition | null;
  sessionWords: WordItem[];
  familiarity: Partial<Record<number, Familiarity>>;
  setSelection: (condition: SelectionCondition | null) => void;
  buildSession: (condition: SelectionCondition, max?: number) => WordItem[];
  markFamiliarity: (id: number, value: Familiarity) => void;
  resetSession: () => void;
};

const WordSetContext = createContext<WordSetContextValue | undefined>(undefined);

const defaultSettings: UserSettings = {
  username: '__default__',
  maxWordsPerSession: 25,
  defaultSelectionType: 'pageRange',
  defaultQuizMode: 'enToZh',
  defaultTtsMode: 'wordOnly',
  defaultTtsIntervalSec: 2
};

export function WordSetProvider({ children }: { children: ReactNode }) {
  const { currentUser, appData } = useAuth();
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<SelectionCondition | null>(null);
  const [sessionWords, setSessionWords] = useState<WordItem[]>([]);
  const [familiarity, setFamiliarity] = useState<Partial<Record<number, Familiarity>>>({});

  const userSettings = useMemo(() => {
    if (!currentUser) return defaultSettings;
    return appData.userSettings.find(s => s.username === currentUser.username) ?? defaultSettings;
  }, [currentUser, appData.userSettings]);

  useEffect(() => {
    let canceled = false;
    const fetchWords = async () => {
      setLoading(true);
      const candidates = getWordDataCandidates();
      try {
        for (const url of candidates) {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as WordItem[];
            if (!canceled) {
              setWords(json);
              return;
            }
          } catch (err) {
            console.warn(`無法從 ${url} 載入單字檔`, err);
          }
        }
        if (!canceled) {
          setWords([]);
          console.error('載入單字檔失敗，已嘗試來源：', candidates);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    fetchWords();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    // 登出後清空 session
    if (!currentUser) {
      setSessionWords([]);
      setSelection(null);
      setFamiliarity({});
    }
  }, [currentUser]);

  const buildSession = (condition: SelectionCondition, max?: number) => {
    const filtered = filterWords(words, condition);
    const maxCount = max ?? userSettings.maxWordsPerSession;
    const chosen = filtered.slice(0, maxCount);
    setSessionWords(chosen);
    setSelection(condition);
    return chosen;
  };

  const markFamiliarity = (id: number, value: Familiarity) => {
    setFamiliarity(prev => ({ ...prev, [id]: value }));
  };

  const resetSession = () => {
    setSessionWords([]);
    setSelection(null);
    setFamiliarity({});
  };

  const value: WordSetContextValue = {
    words,
    loading,
    selection,
    sessionWords,
    familiarity,
    setSelection,
    buildSession,
    markFamiliarity,
    resetSession
  };

  return <WordSetContext.Provider value={value}>{children}</WordSetContext.Provider>;
}

export function useWordSet() {
  const ctx = useContext(WordSetContext);
  if (!ctx) throw new Error('WordSetContext not ready');
  return ctx;
}

function filterWords(words: WordItem[], condition: SelectionCondition) {
  switch (condition.type) {
    case 'pageRange': {
      const [start, end] = condition.pages ?? [1, 999];
      return words.filter(w => w.page >= start && w.page <= end);
    }
    case 'singlePage': {
      const page = condition.pages?.[0];
      if (!page) return words;
      return words.filter(w => w.page === page);
    }
    case 'frequency': {
      const target = condition.frequencyGroup;
      if (target == null) return words;
      return words.filter(w => Array.isArray(w.frequencyGroup) && w.frequencyGroup.includes(target));
    }
    case 'alphabet': {
      const [from, to] = condition.alphabetRange ?? ['a', 'z'];
      return words.filter(w => {
        const first = w.word[0]?.toLowerCase() ?? '';
        return first >= from.toLowerCase() && first <= to.toLowerCase();
      });
    }
    case 'customList':
      return words.filter(w => condition.customWords?.includes(w.word));
    default:
      return words;
  }
}

function getWordDataCandidates(): string[] {
  const urls = new Set<string>();
  const override = import.meta.env.VITE_WORD_DATA_URL;
  if (override) urls.add(override);

  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');
  const appendPath = (path: string) => {
    if (!path.startsWith('/')) path = `/${path}`;
    if (base) {
      urls.add(`${base}${path}`);
      if (typeof window !== 'undefined') {
        urls.add(`${window.location.origin}${base}${path}`);
      }
    }
    urls.add(path);
    urls.add(path.replace(/^\//, ''));
  };

  appendPath('data/words.json');

  if (import.meta.env.DEV) {
    appendPath('data/words-sample.json');
  }

  return Array.from(urls);
}
