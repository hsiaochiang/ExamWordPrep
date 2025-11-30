import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { QuizMode, SelectionType, UserSettings } from '../utils/jsonSchema';

export default function SettingsPage() {
  const { currentUser, appData, upsertSettings } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const found = appData.userSettings.find(s => s.username === currentUser.username);
    setSettings(
      found ?? {
        username: currentUser.username,
        maxWordsPerSession: 25,
        defaultSelectionType: 'pageRange',
        defaultQuizMode: 'enToZh',
        defaultTtsMode: 'wordOnly',
        defaultTtsIntervalSec: 2
      }
    );
  }, [currentUser, appData.userSettings]);

  if (!currentUser || !settings) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    upsertSettings(settings);
    alert('設定已儲存');
  };

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>個人設定</h2>
      <form className="grid" onSubmit={handleSubmit}>
        <label>
          每回合最大單字數量（10–50）
          <input className="input" type="number" min={10} max={50} value={settings.maxWordsPerSession} onChange={e => update('maxWordsPerSession', Number(e.target.value))} />
        </label>
        <label>
          預設選字方式
          <select className="input" value={settings.defaultSelectionType} onChange={e => update('defaultSelectionType', e.target.value as SelectionType)}>
            <option value="pageRange">頁碼範圍</option>
            <option value="frequency">出現次數</option>
            <option value="alphabet">字母區間</option>
            <option value="customList">常錯單字</option>
          </select>
        </label>
        <label>
          預設測驗模式
          <select className="input" value={settings.defaultQuizMode} onChange={e => update('defaultQuizMode', e.target.value as QuizMode)}>
            <option value="enToZh">英 → 中</option>
            <option value="zhToEn">中 → 英</option>
          </select>
        </label>
        <label>
          朗讀模式
          <select className="input" value={settings.defaultTtsMode} onChange={e => update('defaultTtsMode', e.target.value as 'wordOnly' | 'wordAndMeaning')}>
            <option value="wordOnly">只念英文</option>
            <option value="wordAndMeaning">英文 + 中文</option>
          </select>
        </label>
        <label>
          朗讀間隔秒數
          <input className="input" type="number" min={1} max={5} value={settings.defaultTtsIntervalSec} onChange={e => update('defaultTtsIntervalSec', Number(e.target.value))} />
        </label>
        <button className="btn" type="submit">儲存設定</button>
      </form>
    </div>
  );
}
