import { QuizMode, WordItem, getMeaningDisplay } from './jsonSchema';

export interface QuizQuestionItem {
  id: number;
  prompt: string;
  options: string[];
  answer: string;
  mode: QuizMode;
}

export function generateQuizQuestions(words: WordItem[], mode: QuizMode): QuizQuestionItem[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.map(word => {
    const distractors = pickDistractors(words, word, mode);
    const meaning = getMeaningDisplay(word) || word.word;
    const correct = mode === 'enToZh' ? meaning : word.word;
    const prompt = mode === 'enToZh' ? word.word : meaning;
    const options = shuffle([correct, ...distractors]);
    return {
      id: word.id,
      prompt,
      options,
      answer: correct,
      mode
    };
  });
}

function pickDistractors(words: WordItem[], target: WordItem, mode: QuizMode): string[] {
  const pool = words.filter(w => w.id !== target.id);
  const shuffled = shuffle(pool).slice(0, 3);
  return shuffled.map(w => {
    const meaning = getMeaningDisplay(w) || w.word;
    return mode === 'enToZh' ? meaning : w.word;
  });
}

function shuffle<T>(arr: T[]): T[] {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}
