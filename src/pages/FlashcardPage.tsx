import { useEffect, useState } from 'react';
import WordCard from '../components/WordCard';
import { useWordSet } from '../store/WordSetContext';

export default function FlashcardPage() {
  const { sessionWords, familiarity, markFamiliarity } = useWordSet();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'enToZh' | 'zhToEn'>('enToZh');

  useEffect(() => {
    setIndex(0);
  }, [sessionWords]);

  if (sessionWords.length === 0) {
    return <div className="card">尚未建立本回合單字集，請先到「單字範圍選擇」建立。</div>;
  }

  const word = sessionWords[index];
  const familiarityState = familiarity[word.id] ?? 'unmarked';

  const go = (delta: number) => {
    setFlipped(false);
    setIndex(i => (i + delta + sessionWords.length) % sessionWords.length);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0 }}>學習卡模式</h2>
        <select className="input" value={mode} onChange={e => setMode(e.target.value as 'enToZh' | 'zhToEn')} style={{ width: 180 }}>
          <option value="enToZh">英 → 中</option>
          <option value="zhToEn">中 → 英</option>
        </select>
      </div>
      <p>進度：第 {index + 1} / {sessionWords.length} 個</p>
      <WordCard
        word={word}
        flipped={flipped}
        mode={mode}
        familiarity={familiarityState}
        onFlip={() => setFlipped(f => !f)}
        onMark={value => markFamiliarity(word.id, value)}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn secondary" onClick={() => go(-1)}>上一個</button>
        <button className="btn secondary" onClick={() => go(1)}>下一個</button>
      </div>
    </div>
  );
}
