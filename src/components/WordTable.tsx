import { useMemo, useState } from 'react';
import { Familiarity, WordItem } from '../utils/jsonSchema';

type Props = {
  words: WordItem[];
  familiarity: Partial<Record<number, Familiarity>>;
  onMark: (id: number, value: Familiarity) => void;
};

export default function WordTable({ words, familiarity, onMark }: Props) {
  const [sortState, setSortState] = useState<{ column: 'word' | 'frequency'; direction: 'asc' | 'desc' }>({
    column: 'word',
    direction: 'asc'
  });
  const [directionMap, setDirectionMap] = useState<Record<'word' | 'frequency', 'asc' | 'desc'>>({
    word: 'asc',
    frequency: 'asc'
  });
  const [onlyUnknown, setOnlyUnknown] = useState(false);

  const toggleSort = (column: 'word' | 'frequency') => {
    setSortState(prevState => {
      const isSameColumn = prevState.column === column;
      const nextDirection = isSameColumn ? (prevState.direction === 'asc' ? 'desc' : 'asc') : directionMap[column];
      setDirectionMap(prev => ({ ...prev, [column]: nextDirection }));
      return { column, direction: nextDirection };
    });
  };

  const viewWords = useMemo(() => {
    let list = [...words];
    if (onlyUnknown) {
      list = list.filter(w => familiarity[w.id] === 'unknown');
    }
    list.sort((a, b) => {
      const dir = sortState.direction === 'asc' ? 1 : -1;
      if (sortState.column === 'word') return a.word.localeCompare(b.word) * dir;
      const freqA = a.frequencyCount ?? a.frequencyGroup?.length ?? 0;
      const freqB = b.frequencyCount ?? b.frequencyGroup?.length ?? 0;
      return (freqA - freqB) * dir;
    });
    return list;
  }, [words, sortState, onlyUnknown, familiarity]);

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          className={`btn secondary ${sortState.column === 'word' ? 'active' : ''}`}
          onClick={() => toggleSort('word')}
        >
          字母排序 {directionMap.word === 'asc' ? '↑' : '↓'}
        </button>
        <button
          className={`btn secondary ${sortState.column === 'frequency' ? 'active' : ''}`}
          onClick={() => toggleSort('frequency')}
        >
          出現次數排序 {directionMap.frequency === 'asc' ? '↑' : '↓'}
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
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn secondary" onClick={() => onMark(word.id, 'known')}>
                      熟悉
                    </button>
                    <button className="btn secondary" onClick={() => onMark(word.id, 'unknown')}>
                      不熟
                    </button>
                    <span className={`badge ${familiarity[word.id] ?? 'unmarked'}`}>
                      {familiarity[word.id] ? (familiarity[word.id] === 'known' ? '已標記：熟悉' : '已標記：不熟') : '未標記'}
                    </span>
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
        .btn.secondary.active { border-color: #4f46e5; color: #312e81; background: #eef2ff; }
        .badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .badge.known { background: #dcfce7; color: #166534; }
        .badge.unknown { background: #fee2e2; color: #991b1b; }
        .badge.unmarked { background: #f3f4f6; color: #374151; }
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
