import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useWordSet } from '../store/WordSetContext';
import { SelectionCondition, SelectionType } from '../utils/jsonSchema';

export default function UserDashboard() {
  const { currentUser, appData } = useAuth();
  const { words, buildSession } = useWordSet();
  const nav = useNavigate();

  const [type, setType] = useState<SelectionType>('pageRange');
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(2);
  const [frequency, setFrequency] = useState<number>(10);
  const [alphaFrom, setAlphaFrom] = useState('a');
  const [alphaTo, setAlphaTo] = useState('c');
  const [customList, setCustomList] = useState<string>('');
  const [maxCount, setMaxCount] = useState(25);

  const customWrongWords = useMemo(() => {
    if (!currentUser) return [];
    const wrongMap = new Map<string, number>();
    appData.records
      .filter(r => r.username === currentUser.username)
      .forEach(r => r.wrongWords.forEach(w => wrongMap.set(w, (wrongMap.get(w) ?? 0) + 1)));
    return Array.from(wrongMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }, [appData.records, currentUser]);

  const handleBuild = (e?: FormEvent, redirect?: string) => {
    e?.preventDefault();
    const condition: SelectionCondition = (() => {
      switch (type) {
        case 'pageRange':
          return { type, pages: [pageStart, pageEnd] };
        case 'frequency':
          return { type, frequencyGroup: frequency };
        case 'alphabet':
          return { type, alphabetRange: [alphaFrom, alphaTo] };
        case 'customList':
          return { type, customWords: customList.split(',').map(s => s.trim()).filter(Boolean) || customWrongWords };
        default:
          return { type: 'pageRange', pages: [pageStart, pageEnd] };
      }
    })();
    const list = buildSession(condition, maxCount);
    if (list.length === 0) {
      alert('沒有符合條件的單字，請調整範圍');
      return;
    }
    if (redirect) nav(redirect);
  };

  return (
    <div className="grid two">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>選擇本回合單字範圍</h2>
        <form className="grid" onSubmit={handleBuild}>
          <label>
            方式：
            <select className="input" value={type} onChange={e => setType(e.target.value as SelectionType)}>
              <option value="pageRange">依頁碼</option>
              <option value="frequency">依出現次數分級</option>
              <option value="alphabet">依字母區間</option>
              <option value="customList">常錯單字 / 自訂清單</option>
            </select>
          </label>
          {type === 'pageRange' && (
            <div className="grid two">
              <input className="input" type="number" min={1} value={pageStart} onChange={e => setPageStart(Number(e.target.value))} placeholder="起始頁碼" />
              <input className="input" type="number" min={pageStart} value={pageEnd} onChange={e => setPageEnd(Number(e.target.value))} placeholder="結束頁碼" />
            </div>
          )}
          {type === 'frequency' && (
            <input className="input" type="number" min={1} max={10} value={frequency} onChange={e => setFrequency(Number(e.target.value))} placeholder="出現次數分級" />
          )}
          {type === 'alphabet' && (
            <div className="grid two">
              <input className="input" value={alphaFrom} onChange={e => setAlphaFrom(e.target.value)} placeholder="起始字母" />
              <input className="input" value={alphaTo} onChange={e => setAlphaTo(e.target.value)} placeholder="結束字母" />
            </div>
          )}
          {type === 'customList' && (
            <>
              <textarea className="input" rows={3} placeholder="用逗號分隔的單字，例如 apple,banana" value={customList} onChange={e => setCustomList(e.target.value)} />
              {customWrongWords.length > 0 && <div style={{ color: '#6b7280' }}>常錯單字：{customWrongWords.slice(0, 10).join(', ')}</div>}
            </>
          )}
          <label>
            最大單字數（10–50）
            <input className="input" type="number" min={10} max={50} value={maxCount} onChange={e => setMaxCount(Number(e.target.value))} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" type="submit">建立本次學習清單</button>
            <button className="btn secondary" type="button" onClick={e => handleBuild(e as unknown as FormEvent, '/words')}>前往單字總覽</button>
            <button className="btn secondary" type="button" onClick={e => handleBuild(e as unknown as FormEvent, '/flashcards')}>直接進入學習卡</button>
            <button className="btn secondary" type="button" onClick={e => handleBuild(e as unknown as FormEvent, '/quiz')}>直接進入測驗</button>
          </div>
        </form>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>目前符合條件的單字數</h3>
        <p>本次單字庫總數：{words.length}</p>
        <p>常錯單字數：{customWrongWords.length}</p>
        <p>建立清單後即可在「單字總覽 / 學習卡 / 測驗」使用。</p>
      </div>
    </div>
  );
}
