import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Familiarity, SelectionCondition, UserSettings, WordItem } from '../utils/jsonSchema';
import { useAuth } from './AuthContext';

type WordSetContextValue = {
  words: WordItem[];
  loading: boolean;
  selection: SelectionCondition | null;
  sessionWords: WordItem[];
  familiarity: Record<string, Familiarity>;
  setSelection: (condition: SelectionCondition | null) => void;
  buildSession: (condition: SelectionCondition, max?: number) => WordItem[];
  markFamiliarity: (id: string, value: Familiarity) => void;
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
  const [familiarity, setFamiliarity] = useState<Record<string, Familiarity>>({});

  const userSettings = useMemo(() => {
    if (!currentUser) return defaultSettings;
    return appData.userSettings.find(s => s.username === currentUser.username) ?? defaultSettings;
  }, [currentUser, appData.userSettings]);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const res = await fetch('/data/words-sample.json');
        const json = (await res.json()) as WordItem[];
        setWords(json);
      } catch (err) {
        console.error('載入單字檔失敗', err);
        setWords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWords();
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

  const markFamiliarity = (id: string, value: Familiarity) => {
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
    case 'frequency':
      return words.filter(w => w.frequencyGroup === condition.frequencyGroup);
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
