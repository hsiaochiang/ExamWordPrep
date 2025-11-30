import { useEffect, useState } from 'react';
import WordTable from '../components/WordTable';
import { useWordSet } from '../store/WordSetContext';
import { speakWord } from '../utils/tts';

export default function WordListPage() {
  const { sessionWords, familiarity, markFamiliarity, selection } = useWordSet();
  const [index, setIndex] = useState(0);
  const [play, setPlay] = useState(false);
  const [withMeaning, setWithMeaning] = useState(false);
  const [intervalSec, setIntervalSec] = useState(5);

  useEffect(() => {
    if (!play) return;
    if (sessionWords.length === 0) return;
    const timer = setTimeout(() => {
      const word = sessionWords[index];
      if (word) {
        speakWord(word, withMeaning);
        const next = (index + 1) % sessionWords.length;
        setIndex(next);
      }
    }, intervalSec * 1000);
    return () => clearTimeout(timer);
  }, [play, index, intervalSec, sessionWords, withMeaning]);

  useEffect(() => {
    setIndex(0);
  }, [sessionWords]);

  if (sessionWords.length === 0) {
    return <div className="card">尚未建立本回合單字集，請先到「單字範圍選擇」建立。</div>;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>單字總覽</h2>
        <p style={{ color: '#6b7280' }}>目前條件：{selection?.type ?? '未設定'}，共 {sessionWords.length} 個單字</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <button className="btn secondary" onClick={() => setPlay(p => !p)}>{play ? '暫停朗讀' : '播放朗讀'}</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={withMeaning} onChange={e => setWithMeaning(e.target.checked)} /> 英文 + 中文
          </label>
          <label>
            間隔秒數
            <input className="input" type="number" min={1} max={5} value={intervalSec} onChange={e => setIntervalSec(Number(e.target.value) || 1)} style={{ width: 80 }} />
          </label>
        </div>
      </div>
      <WordTable words={sessionWords} familiarity={familiarity} onMark={markFamiliarity} />
    </div>
  );
}
