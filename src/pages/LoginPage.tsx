import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const ok = login(username.trim(), password.trim());
    if (!ok) {
      setError('帳號或密碼錯誤，請再試一次');
      return;
    }
    setError('');
    if (username === 'admin') {
      nav('/admin/users');
    } else {
      nav('/dashboard');
    }
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('密碼與確認密碼不一致');
      return;
    }
    const res = register(username.trim(), password.trim());
    if (!res.ok) {
      setError(res.message ?? '註冊失敗');
      return;
    }
    setError('');
    nav('/dashboard');
  };

  return (
    <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}>
      <h1 style={{ marginTop: 0 }}>會考單字學習網站</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className={`btn secondary ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>登入</button>
        <button className={`btn secondary ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>註冊</button>
      </div>
      {error && <div style={{ color: '#b91c1c', marginBottom: 8 }}>{error}</div>}
      {mode === 'login' ? (
        <form className="grid" onSubmit={handleLogin}>
          <input className="input" placeholder="帳號" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="input" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn" type="submit">登入</button>
        </form>
      ) : (
        <form className="grid" onSubmit={handleRegister}>
          <input className="input" placeholder="帳號" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="input" type="password" placeholder="密碼" value={password} onChange={e => setPassword(e.target.value)} />
          <input className="input" type="password" placeholder="確認密碼" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <button className="btn" type="submit">建立新帳號</button>
        </form>
      )}
      <p style={{ color: '#6b7280', marginTop: 8 }}>預設管理者帳號：admin / admin</p>
    </div>
  );
}
