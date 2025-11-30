import { useCallback, useEffect, useMemo, useState } from 'react';
import WordCard from '../components/WordCard';
import { useWordSet } from '../store/WordSetContext';

export default function FlashcardPage() {
  const { sessionWords, familiarity, markFamiliarity } = useWordSet();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'enToZh' | 'zhToEn'>('enToZh');

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [sessionWords]);

  if (sessionWords.length === 0) {
    return <div className="card">尚未建立本回合單字集，請先到「單字範圍選擇」建立。</div>;
  }

  const word = sessionWords[index];
  const familiarityState = familiarity[word.id] ?? 'unmarked';
  const progressPercent = useMemo(() => Math.round(((index + 1) / sessionWords.length) * 100), [index, sessionWords.length]);

  const go = useCallback((delta: number) => {
    setFlipped(false);
    setIndex(i => (i + delta + sessionWords.length) % sessionWords.length);
  }, [sessionWords.length]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        setFlipped(f => !f);
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        go(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginTop: 0 }}>學習卡模式</h2>
        <select className="input" value={mode} onChange={e => setMode(e.target.value as 'enToZh' | 'zhToEn')} style={{ width: 180 }}>
          <option value="enToZh">英 → 中</option>
          <option value="zhToEn">中 → 英</option>
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <p style={{ marginBottom: 4 }}>進度：第 {index + 1} / {sessionWords.length} 個（{progressPercent}%）</p>
        <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, overflow: 'hidden' }} aria-hidden={true}>
          <div style={{ width: `${progressPercent}%`, background: '#4f46e5', height: '100%', transition: 'width 0.3s ease' }} />
        </div>
      </div>
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
      <p style={{ marginTop: 12, fontSize: 14, color: '#4b5563' }}>
        快捷鍵：空白鍵翻面、← 上一個、→ 下一個
      </p>
    </div>
  );
}
