import { useMemo, useState } from 'react';
import { Familiarity, WordItem } from '../utils/jsonSchema';

type Props = {
  words: WordItem[];
  familiarity: Partial<Record<number, Familiarity>>;
  onMark: (id: number, value: Familiarity) => void;
};

export default function WordTable({ words, familiarity, onMark }: Props) {
  const [sortBy, setSortBy] = useState<'word' | 'frequency'>('word');
  const [asc, setAsc] = useState(true);
  const [onlyUnknown, setOnlyUnknown] = useState(false);

  const viewWords = useMemo(() => {
    let list = [...words];
    if (onlyUnknown) {
      list = list.filter(w => familiarity[w.id] === 'unknown');
    }
    list.sort((a, b) => {
      const dir = asc ? 1 : -1;
      if (sortBy === 'word') return a.word.localeCompare(b.word) * dir;
      const freqA = a.frequencyCount ?? a.frequencyGroup?.length ?? 0;
      const freqB = b.frequencyCount ?? b.frequencyGroup?.length ?? 0;
      return (freqA - freqB) * dir;
    });
    return list;
  }, [words, sortBy, asc, onlyUnknown, familiarity]);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button className="btn secondary" onClick={() => { setSortBy('word'); setAsc(!asc); }}>
          字母排序 {asc ? '↑' : '↓'}
        </button>
        <button className="btn secondary" onClick={() => { setSortBy('frequency'); setAsc(!asc); }}>
          出現次數排序 {asc ? '↑' : '↓'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={onlyUnknown} onChange={e => setOnlyUnknown(e.target.checked)} />
          僅顯示不熟單字
        </label>
      </div>
      <div className="table-scroll">
        <table className="word-table">
          <thead>
            <tr>
              <th>單字</th>
              <th>詞性及解釋</th>
              <th>出現次數等級</th>
              <th>熟悉度</th>
            </tr>
          </thead>
          <tbody>
            {viewWords.map(word => (
              <tr key={word.id}>
                <td data-label="單字">{word.word}</td>
                <td data-label="詞性＋中文解釋">{
                  word.posList && word.posList.length > 0
                    ? word.posList.map(item => `${item.pos} ${item.meaningZh}`).join('； ')
                    : '—'
                }</td>
                <td data-label="出現次數等級" style={{ textAlign: 'center' }}>{word.frequencyCount ?? word.frequencyGroup?.length ?? 0}</td>
                <td data-label="熟悉度">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" onClick={() => onMark(word.id, 'known')}>
                      熟悉
                    </button>
                    <button className="btn secondary" onClick={() => onMark(word.id, 'unknown')}>
                      不熟
                    </button>
                    <span>{familiarity[word.id] ?? '未標記'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .table-scroll { overflow-x: auto; }
        .word-table { width: 100%; border-collapse: collapse; }
        .word-table th, .word-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        @media (max-width: 720px) {
          .word-table, .word-table thead { display: none; }
          .word-table tr { display: block; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; margin-bottom: 10px; }
          .word-table td { display: flex; justify-content: space-between; align-items: center; }
          .word-table td::before { content: attr(data-label); font-weight: 600; margin-right: 6px; }
        }
      `}</style>
    </div>
  );
}
