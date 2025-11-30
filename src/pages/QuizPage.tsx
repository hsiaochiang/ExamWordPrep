import { useEffect, useMemo, useState } from 'react';
import QuizQuestion from '../components/QuizQuestion';
import { useAuth } from '../store/AuthContext';
import { useWordSet } from '../store/WordSetContext';
import { QuizMode } from '../utils/jsonSchema';
import { generateQuizQuestions, QuizQuestionItem } from '../utils/quizGenerator';

export default function QuizPage() {
  const { sessionWords, selection } = useWordSet();
  const { currentUser, addRecord } = useAuth();
  const [mode, setMode] = useState<QuizMode>('enToZh');
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | undefined>();
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<string[]>([]);

  useEffect(() => {
    if (sessionWords.length > 0) {
      const qs = generateQuizQuestions(sessionWords, mode);
      setQuestions(qs);
      setIndex(0);
      setSelected(undefined);
      setShowAnswer(false);
      setCorrectCount(0);
      setWrongWords([]);
    }
  }, [sessionWords, mode]);

  const current = questions[index];
  const finished = useMemo(() => index >= questions.length, [index, questions.length]);

  const handleSelect = (option: string) => {
    if (!current) return;
    setSelected(option);
    setShowAnswer(true);
    if (option === current.answer) {
      setCorrectCount(c => c + 1);
    } else {
      setWrongWords(list => Array.from(new Set([...list, current.mode === 'enToZh' ? current.prompt : current.answer])));
    }
  };

  const goNext = () => {
    setSelected(undefined);
    setShowAnswer(false);
    setIndex(i => i + 1);
  };

  const handleFinish = () => {
    if (!currentUser) return;
    addRecord({
      username: currentUser.username,
      createdAt: new Date().toISOString(),
      selectionCondition: selection ?? { type: 'pageRange', pages: [1, 1] },
      wordCount: sessionWords.length,
      quiz: {
        mode,
        totalQuestions: questions.length,
        correctCount,
        accuracy: questions.length ? correctCount / questions.length : 0
      },
      wrongWords
    });
    alert('結果已寫入歷史紀錄');
  };

  if (sessionWords.length === 0) {
    return <div className="card">尚未建立本回合單字集，請先到「單字範圍選擇」建立。</div>;
  }

  if (finished) {
    const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>測驗完成</h2>
        <p>總題數：{questions.length}</p>
        <p>答對：{correctCount}</p>
        <p>正確率：{accuracy}%</p>
        <p>本回合答錯單字：{wrongWords.join(', ') || '無'}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn secondary" onClick={handleFinish}>將結果寫入歷史紀錄</button>
          <button className="btn" onClick={() => setIndex(0)}>再測一次</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0 }}>測驗模式</h2>
        <select className="input" value={mode} onChange={e => setMode(e.target.value as QuizMode)} style={{ width: 200 }}>
          <option value="enToZh">英 → 中</option>
          <option value="zhToEn">中 → 英</option>
        </select>
      </div>
      <p>進度：第 {index + 1} / {questions.length}</p>
      {current && (
        <QuizQuestion
          question={current}
          selected={selected}
          onSelect={handleSelect}
          showAnswer={showAnswer}
        />
      )}
      {showAnswer && <button className="btn" onClick={goNext}>下一題</button>}
    </div>
  );
}
