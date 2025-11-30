import { useMemo } from 'react';
import { useAuth } from '../store/AuthContext';

export default function HistoryPage() {
  const { currentUser, appData } = useAuth();
  if (!currentUser) return null;

  const records = appData.records.filter(r => r.username === currentUser.username);
  const wrongList = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach(r => r.wrongWords.forEach(w => map.set(w, (map.get(w) ?? 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [records]);

  return (
    <div className="grid two">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>歷史紀錄</h2>
        {records.length === 0 && <p>尚無紀錄</p>}
        {records.map(r => (
          <div key={r.sessionId} style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
            <div>日期：{new Date(r.createdAt).toLocaleString()}</div>
            <div>條件：{r.selectionCondition.type}</div>
            <div>單字數：{r.wordCount}</div>
            <div>答對/題數：{r.quiz.correctCount} / {r.quiz.totalQuestions}（{Math.round(r.quiz.accuracy * 100)}%）</div>
            <div>錯誤單字：{r.wrongWords.join(', ') || '無'}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>常錯單字</h3>
        {wrongList.length === 0 && <p>目前沒有常錯單字。</p>}
        {wrongList.map(([word, count]) => (
          <div key={word} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span>{word}</span>
            <span>錯 {count} 次</span>
          </div>
        ))}
      </div>
    </div>
  );
}
