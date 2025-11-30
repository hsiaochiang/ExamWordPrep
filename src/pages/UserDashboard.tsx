import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useWordSet } from '../store/WordSetContext';
import { SelectionCondition, SelectionType, WordItem } from '../utils/jsonSchema';

const alphabetPresetOptions = [
  { id: 'A-C', label: 'A - C', from: 'a', to: 'c' },
  { id: 'D-F', label: 'D - F', from: 'd', to: 'f' },
  { id: 'G-I', label: 'G - I', from: 'g', to: 'i' },
  { id: 'J-L', label: 'J - L', from: 'j', to: 'l' },
  { id: 'M-O', label: 'M - O', from: 'm', to: 'o' },
  { id: 'P-R', label: 'P - R', from: 'p', to: 'r' },
  { id: 'S-U', label: 'S - U', from: 's', to: 'u' },
  { id: 'V-Z', label: 'V - Z', from: 'v', to: 'z' }
];

const maxOptions = Array.from({ length: 9 }, (_, idx) => 10 + idx * 5);

type QuickAction = {
  label: string;
  description: string;
  to: string;
  tone: 'primary' | 'secondary';
};

const quickActions: QuickAction[] = [
  {
    label: '前往單字總覽',
    description: '確認挑選結果並調整熟悉度',
    to: '/words',
    tone: 'primary'
  },
  {
    label: '直接進入學習卡',
    description: '用翻牌模式快速記憶單字',
    to: '/flashcards',
    tone: 'secondary'
  },
  {
    label: '直接進入測驗',
    description: '立即測驗並蒐集常錯字',
    to: '/quiz',
    tone: 'secondary'
  }
];

export default function UserDashboard() {
  const { currentUser, appData } = useAuth();
  const { words, buildSession } = useWordSet();
  const nav = useNavigate();

  const [type, setType] = useState<SelectionType>('singlePage');
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(2);
  const [singlePage, setSinglePage] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<number>(10);
  const [alphabetKey, setAlphabetKey] = useState(alphabetPresetOptions[0].id);
  const [customList, setCustomList] = useState<string>('');
  const [maxCount, setMaxCount] = useState(25);
  const [status, setStatus] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const pageOptions = useMemo(() => {
    const unique = new Set<number>();
    words.forEach(word => unique.add(word.page));
    return Array.from(unique).sort((a, b) => a - b);
  }, [words]);

  useEffect(() => {
    if (pageOptions.length === 0) return;
    if (singlePage == null || !pageOptions.includes(singlePage)) {
      setSinglePage(pageOptions[0]);
    }
  }, [pageOptions, singlePage]);

  const selectedAlphabetRange = alphabetPresetOptions.find(option => option.id === alphabetKey) ?? alphabetPresetOptions[0];

  const selectionCondition = useMemo<SelectionCondition>(() => {
    switch (type) {
      case 'pageRange':
        return { type, pages: [pageStart, pageEnd] };
      case 'singlePage': {
        const target = singlePage ?? pageOptions[0] ?? 1;
        return { type, pages: [target, target] };
      }
      case 'frequency':
        return { type, frequencyGroup: frequency };
      case 'alphabet':
        return { type, alphabetRange: [selectedAlphabetRange.from, selectedAlphabetRange.to] };
      case 'customList': {
        const manualList = customList
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        const finalList = manualList.length > 0 ? manualList : customWrongWords;
        return { type, customWords: finalList };
      }
      default:
        return { type: 'pageRange', pages: [pageStart, pageEnd] };
    }
  }, [type, pageStart, pageEnd, singlePage, pageOptions, frequency, selectedAlphabetRange, customList, customWrongWords]);

  const previewCount = useMemo(() => countWordsByCondition(words, selectionCondition), [words, selectionCondition]);

  const handleBuild = (e?: FormEvent, redirect?: string) => {
    e?.preventDefault();
    setIsProcessing(true);
    setStatus({ tone: 'info', message: '正在建立本回合單字清單…' });
    const list = buildSession(selectionCondition, maxCount);
    if (list.length === 0) {
      setStatus({ tone: 'error', message: '沒有符合條件的單字，請調整範圍或放寬條件。' });
      setIsProcessing(false);
      return;
    }
    setStatus({ tone: 'success', message: `已成功挑選 ${list.length} 個單字，祝學習順利！` });
    setIsProcessing(false);
    if (redirect) nav(redirect);
  };

  return (
    <div className="dashboard-layout">
      <div className="card selection-card">
        <div className="section-header">
          <span className="section-pill">STEP 1</span>
          <h2>選擇本回合單字範圍</h2>
          <p className="section-desc">挑選條件 → 檢視統計 → 按「前往單字總覽」正式開始。</p>
        </div>
        <form className="grid" onSubmit={handleBuild}>
          <label className="field-label">
            選擇方式
            <select className="input" value={type} onChange={e => setType(e.target.value as SelectionType)}>
              <option value="singlePage">依單一頁面（下拉選擇）</option>
              <option value="pageRange">依連續頁碼（可多頁）</option>
              <option value="frequency">依出現次數分級</option>
              <option value="alphabet">依字母區間</option>
              <option value="customList">常錯單字 / 自訂清單</option>
            </select>
          </label>

          {type === 'pageRange' && (
            <div className="range-row">
              <label className="field-label">
                起始頁碼
                <input className="input" type="number" min={1} value={pageStart} onChange={e => setPageStart(Number(e.target.value))} />
              </label>
              <label className="field-label">
                結束頁碼
                <input className="input" type="number" min={pageStart} value={pageEnd} onChange={e => setPageEnd(Number(e.target.value))} />
              </label>
            </div>
          )}

          {type === 'singlePage' && (
            <label className="field-label">
              選擇單一頁面
              <select className="input" value={singlePage ?? ''} onChange={e => setSinglePage(Number(e.target.value))} disabled={pageOptions.length === 0}>
                {pageOptions.length === 0 && (
                  <option value="" disabled>
                    尚未載入單字
                  </option>
                )}
                {pageOptions.map(page => (
                  <option key={page} value={page}>
                    第 {page} 頁
                  </option>
                ))}
              </select>
            </label>
          )}

          {type === 'frequency' && (
            <label className="field-label">
              單字出現次數等級
              <select className="input" value={frequency} onChange={e => setFrequency(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => 10 - i).map(level => (
                  <option key={level} value={level}>
                    等級 {level}
                  </option>
                ))}
              </select>
            </label>
          )}

          {type === 'alphabet' && (
            <label className="field-label">
              字母範圍
              <select className="input" value={alphabetKey} onChange={e => setAlphabetKey(e.target.value)}>
                {alphabetPresetOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {type === 'customList' && (
            <div className="custom-section">
              <label className="field-label">
                自訂單字清單
                <textarea
                  className="input"
                  rows={3}
                  placeholder="用逗號分隔的單字，例如 apple, banana"
                  value={customList}
                  onChange={e => setCustomList(e.target.value)}
                />
              </label>
              {customWrongWords.length > 0 && (
                <div className="chip-row">
                  {customWrongWords.slice(0, 6).map(word => (
                    <span className="chip" key={word}>
                      {word}
                    </span>
                  ))}
                  {customWrongWords.length > 6 && <span className="chip muted">…</span>}
                </div>
              )}
            </div>
          )}

          {type !== 'singlePage' && (
            <label className="field-label">
              最大單字數（10–50）
              <select className="input" value={maxCount} onChange={e => setMaxCount(Number(e.target.value))}>
                {maxOptions.map(option => (
                  <option key={option} value={option}>
                    {option} 個單字
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="action-toolbar">
            <div className="toolbar-header">
              <span className="section-pill light">STEP 3</span>
              <p>完成條件挑選後，先前往單字總覽確認，再依需求進入其他模式。</p>
            </div>
            <div className="action-panel">
              {quickActions.map(action => (
                <button
                  key={action.to}
                  type="button"
                  className={`action-card ${action.tone} ${isProcessing ? 'disabled' : ''}`}
                  onClick={e => handleBuild(e as unknown as FormEvent, action.to)}
                  disabled={isProcessing}
                >
                  <div className="action-text">
                    <span className="action-label">{action.label}</span>
                    <span className="action-desc">{action.description}</span>
                  </div>
                  <span className="action-arrow" aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
          {status && (
            <div className={`status-banner ${status.tone}`} aria-live="polite">
              {status.message}
            </div>
          )}
        </form>
      </div>

      <div className="card stats-card">
        <div className="section-header">
          <span className="section-pill light">STEP 2</span>
          <h3>立即檢視挑選結果</h3>
          <p className="section-desc">確認數量後，再按「前往單字總覽」開始學習。</p>
        </div>
        <div className="stats-grid">
          <div className="stat">
            <div className="stat-label">預估符合條件</div>
            <div className="stat-value">{previewCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">單字庫總數</div>
            <div className="stat-value">{words.length}</div>
          </div>
          <div className="stat">
            <div className="stat-label">常錯字候選</div>
            <div className="stat-value">{customWrongWords.length}</div>
          </div>
        </div>
        <ul className="tips-list">
          <li>建立清單後，可在「單字總覽／學習卡／測驗」同步使用。</li>
          <li>若數量為 0，請調整範圍或放寬條件後再試一次。</li>
        </ul>
      </div>

      <style>{`
        .dashboard-layout {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .dashboard-layout {
            grid-template-columns: 1fr;
          }
        }
        .selection-card { background: #f8fafc; border: 1px solid #e2e8f0; }
        .stats-card { background: #e0f2fe; color: #000000; border: 1px solid #bae6fd; }
        .stats-card .section-desc { color: #000000; }
        .stats-card .section-pill.light { background: rgba(0,0,0,0.08); color: #000; }
        .stats-card h3 { color: #000; }
        .section-header { margin-bottom: 12px; }
        .section-pill {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .section-pill.light { background: rgba(255,255,255,0.15); color: #fff; }
        .section-desc { margin: 0; color: #475467; font-size: 14px; }
        .field-label { display: flex; flex-direction: column; gap: 6px; font-weight: 600; color: #1f2937; }
        .range-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        .custom-section { display: flex; flex-direction: column; gap: 12px; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { background: #e0e7ff; color: #312e81; padding: 4px 8px; border-radius: 999px; font-size: 12px; }
        .chip.muted { background: transparent; color: #334155; border: 1px solid rgba(51,65,85,0.6); }
        .btn.primary { background: #4f46e5; color: #fff; border: none; }
        .btn.primary.disabled { opacity: 0.7; cursor: not-allowed; }
        .btn.secondary { border: 1px solid #cbd5f5; color: #1d4ed8; background: #fff; }
        .action-toolbar { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
        .toolbar-header { display: flex; flex-direction: column; gap: 4px; color: #475467; }
        .toolbar-header p { margin: 0; font-size: 14px; }
        .action-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .action-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 16px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          background: #fff;
          text-align: left;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .action-card.primary { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
        .action-card.secondary { background: #f8fafc; }
        .action-card.disabled { opacity: 0.7; cursor: not-allowed; }
        .action-card:not(.disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,23,42,0.12); }
        .action-text { display: flex; flex-direction: column; gap: 4px; }
        .action-label { font-size: 16px; font-weight: 700; }
        .action-card.secondary .action-label { color: #0f172a; }
        .action-card.secondary .action-desc { color: #475467; }
        .action-desc { font-size: 13px; opacity: 0.9; }
        .action-arrow { font-size: 20px; }
        .status-banner { margin-top: 12px; padding: 10px 12px; border-radius: 8px; font-size: 14px; }
        .status-banner.info { background: #e0f2fe; color: #0369a1; }
        .status-banner.success { background: #dcfce7; color: #166534; }
        .status-banner.error { background: #fee2e2; color: #b91c1c; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 16px 0; }
        .stat { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; }
        .stat-label { font-size: 13px; color: #000000; }
        .stat-value { font-size: 28px; font-weight: 700; color: #000000; }
        .tips-list { margin: 0; padding-left: 20px; color: #000000; font-size: 14px; }
        .tips-list li { margin-bottom: 6px; }
      `}</style>
    </div>
  );
}

function countWordsByCondition(words: WordItem[], condition: SelectionCondition) {
  if (!condition) return 0;
  switch (condition.type) {
    case 'pageRange': {
      const [start, end] = condition.pages ?? [1, 999];
      return words.filter(w => w.page >= start && w.page <= end).length;
    }
    case 'singlePage': {
      const target = condition.pages?.[0];
      if (target == null) return 0;
      return words.filter(w => w.page === target).length;
    }
    case 'frequency': {
      const group = condition.frequencyGroup;
      if (group == null) return words.length;
      return words.filter(w => Array.isArray(w.frequencyGroup) && w.frequencyGroup.includes(group)).length;
    }
    case 'alphabet': {
      const [from, to] = condition.alphabetRange ?? ['a', 'z'];
      return words.filter(w => {
        const first = w.word[0]?.toLowerCase() ?? '';
        return first >= from && first <= to;
      }).length;
    }
    case 'customList': {
      const targets = condition.customWords ?? [];
      if (targets.length === 0) return 0;
      const set = new Set(targets.map(word => word.toLowerCase()));
      return words.filter(w => set.has(w.word.toLowerCase())).length;
    }
    default:
      return words.length;
  }
}
