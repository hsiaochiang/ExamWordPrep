import { Familiarity, WordItem } from '../utils/jsonSchema';

type Props = {
  word: WordItem;
  flipped: boolean;
  mode: 'enToZh' | 'zhToEn';
  familiarity: Familiarity;
  onFlip: () => void;
  onMark: (value: Familiarity) => void;
};

export default function WordCard({ word, flipped, mode, familiarity, onFlip, onMark }: Props) {
  const front = mode === 'enToZh' ? word.word : word.meaningZh;
  const back = mode === 'enToZh' ? `${word.posRaw} ${word.meaningZh}` : `${word.word} (${word.posRaw})`;

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className={`flash-card ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
        <div className="face front">{front}</div>
        <div className="face back">{back}</div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button className="btn secondary" onClick={onFlip}>翻面</button>
        <button className="btn secondary" onClick={() => onMark('known')}>標記熟悉</button>
        <button className="btn secondary" onClick={() => onMark('unknown')}>標記不熟</button>
        <span>目前標記：{familiarity ?? '未標記'}</span>
      </div>
      <style>{`
        .flash-card {
          perspective: 1000px;
          width: 100%;
          min-height: 180px;
          cursor: pointer;
          position: relative;
        }
        .flash-card .face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          backface-visibility: hidden;
          transition: transform 0.6s;
          padding: 24px;
        }
        .flash-card .back {
          transform: rotateY(180deg);
          background: #f8fafc;
        }
        .flash-card.flipped .front {
          transform: rotateY(180deg);
        }
        .flash-card.flipped .back {
          transform: rotateY(360deg);
        }
      `}</style>
    </div>
  );
}
