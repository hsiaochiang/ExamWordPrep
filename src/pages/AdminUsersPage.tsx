import { useState } from 'react';
import FileImportExport from '../components/FileImportExport';
import { useAuth } from '../store/AuthContext';
import { AppData, User } from '../utils/jsonSchema';

export default function AdminUsersPage() {
  const { appData, updateAppData, currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', isAdmin: false });

  const openNew = () => {
    setForm({ username: '', password: '', isAdmin: false });
    setEditingUser(null);
    setShowForm(true);
  };

  const openEdit = (user: User) => {
    setForm({ username: user.username, password: user.password, isAdmin: user.isAdmin });
    setEditingUser(user);
    setShowForm(true);
  };

  const save = () => {
    updateAppData(data => {
      if (editingUser) {
        const users = data.users.map(u => (u.username === editingUser.username ? { ...u, ...form } : u));
        return { ...data, users };
      }
      const now = new Date().toISOString();
      const newUser: User = { ...form, createdAt: now, lastLoginAt: null };
      return { ...data, users: [...data.users, newUser] };
    });
    setShowForm(false);
  };

  const remove = (user: User) => {
    if (!window.confirm(`確定要刪除使用者 ${user.username}？相關紀錄也會被移除。`)) return;
    updateAppData(data => ({
      ...data,
      users: data.users.filter(u => u.username !== user.username),
      records: data.records.filter(r => r.username !== user.username),
      userSettings: data.userSettings.filter(s => s.username !== user.username)
    }));
  };

  const resetRecords = (user: User) => {
    if (!window.confirm(`要清空 ${user.username} 的歷史紀錄與常錯單字嗎？`)) return;
    updateAppData(data => ({ ...data, records: data.records.filter(r => r.username !== user.username) }));
  };

  const mergeImport = (incoming: AppData, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      updateAppData(() => incoming);
      return;
    }
    updateAppData(data => {
      const users = mergeByKey(data.users, incoming.users, 'username');
      const records = [...incoming.records, ...data.records];
      const userSettings = mergeByKey(data.userSettings, incoming.userSettings, 'username');
      return { users, records, userSettings };
    });
  };

  return (
    <div className="grid">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>使用者帳號管理</h2>
        <button className="btn" onClick={openNew}>新增使用者</button>
        <div className="table-scroll" style={{ marginTop: 12 }}>
          <table className="word-table">
            <thead>
              <tr>
                <th>帳號</th>
                <th>密碼</th>
                <th>管理者</th>
                <th>建立時間</th>
                <th>最近登入</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {appData.users.map(u => (
                <tr key={u.username}>
                  <td>{u.username}</td>
                  <td>{u.password}</td>
                  <td>{u.isAdmin ? '是' : '否'}</td>
                  <td>{u.createdAt && new Date(u.createdAt).toLocaleString()}</td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '尚未登入'}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn secondary" onClick={() => openEdit(u)}>編輯</button>
                    <button className="btn secondary" onClick={() => resetRecords(u)}>重設紀錄</button>
                    {currentUser?.username !== u.username && (
                      <button className="btn danger" onClick={() => remove(u)}>刪除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <FileImportExport data={appData} onImport={mergeImport} />
      {showForm && (
        <div className="card">
          <h3>{editingUser ? '編輯使用者' : '新增使用者'}</h3>
          <div className="grid">
            <input className="input" placeholder="帳號" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} disabled={!!editingUser} />
            <input className="input" placeholder="密碼" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <label>
              <input type="checkbox" checked={form.isAdmin} onChange={e => setForm({ ...form, isAdmin: e.target.checked })} /> 管理者
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={save}>儲存</button>
              <button className="btn secondary" onClick={() => setShowForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mergeByKey<T extends Record<string, any>>(base: T[], incoming: T[], key: keyof T) {
  const map = new Map<string, T>();
  base.forEach(item => map.set(String(item[key]), item));
  incoming.forEach(item => map.set(String(item[key]), item));
  return Array.from(map.values());
}
