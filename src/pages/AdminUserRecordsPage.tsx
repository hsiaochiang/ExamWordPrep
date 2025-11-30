import { useMemo, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { User } from '../utils/jsonSchema';

export default function AdminUserRecordsPage() {
  const { appData } = useAuth();
  const [selected, setSelected] = useState<User | null>(appData.users[0] ?? null);
  const records = useMemo(() => {
    if (!selected) return [];
    return appData.records.filter(r => r.username === selected.username);
  }, [selected, appData.records]);

  const wrongList = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach(r => r.wrongWords.forEach(w => map.set(w, (map.get(w) ?? 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [records]);

  return (
    <div className="grid two">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>使用者列表</h3>
        <input className="input" placeholder="搜尋帳號" onChange={e => {
          const val = e.target.value.toLowerCase();
          const found = appData.users.find(u => u.username.toLowerCase().includes(val));
          if (found) setSelected(found);
        }} />
        <div style={{ maxHeight: 360, overflowY: 'auto', marginTop: 8 }}>
          {appData.users.map(u => (
            <div key={u.username} style={{ padding: 8, borderBottom: '1px solid #e5e7eb', cursor: 'pointer', background: selected?.username === u.username ? '#eef2ff' : undefined }} onClick={() => setSelected(u)}>
              {u.username} {u.isAdmin && '(管理者)'}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>學習紀錄</h3>
        {selected ? <p>目前查看：{selected.username}</p> : <p>請選擇使用者</p>}
        {records.length === 0 && <p>尚無紀錄</p>}
        {records.map(r => (
          <div key={r.sessionId} style={{ borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}>
            <div>日期：{new Date(r.createdAt).toLocaleString()}</div>
            <div>條件：{r.selectionCondition.type}</div>
            <div>單字數：{r.wordCount}</div>
            <div>得分：{r.quiz.correctCount}/{r.quiz.totalQuestions}（{Math.round(r.quiz.accuracy * 100)}%）</div>
            <div>錯誤單字：{r.wrongWords.join(', ') || '無'}</div>
          </div>
        ))}
        <h4>常錯單字</h4>
        {wrongList.length === 0 && <p>目前沒有常錯統計。</p>}
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
