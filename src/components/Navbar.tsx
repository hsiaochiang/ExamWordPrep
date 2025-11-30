import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const links = [
  { to: '/dashboard', label: '單字範圍選擇' },
  { to: '/words', label: '單字總覽' },
  { to: '/flashcards', label: '學習卡' },
  { to: '/quiz', label: '測驗' },
  { to: '/history', label: '歷史紀錄' },
  { to: '/settings', label: '設定' }
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = currentUser?.isAdmin;

  return (
    <header className="nav">
      <div className="nav-brand">
        <Link to="/dashboard">會考單字學習網站</Link>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="開啟選單">
          ☰
        </button>
      </div>
      <nav className={`nav-links ${open ? 'open' : ''}`}>
        {links.map(link => (
          <Link key={link.to} to={link.to} className={pathname === link.to ? 'active' : ''} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <Link to="/admin/users" className={pathname === '/admin/users' ? 'active' : ''} onClick={() => setOpen(false)}>
              使用者管理
            </Link>
            <Link to="/admin/records" className={pathname === '/admin/records' ? 'active' : ''} onClick={() => setOpen(false)}>
              使用者紀錄
            </Link>
          </>
        )}
        <button className="btn secondary" onClick={() => logout()} style={{ marginLeft: 8 }}>
          登出
        </button>
      </nav>
      <style>{`
        .nav {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nav-brand {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-brand a {
          text-decoration: none;
          color: #111827;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-links a {
          text-decoration: none;
          color: #1f2937;
          padding: 6px 8px;
          border-radius: 8px;
        }
        .nav-links a.active {
          background: #eef2ff;
          color: #1d4ed8;
        }
        .nav-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }
        @media (max-width: 820px) {
          .nav {
            flex-wrap: wrap;
          }
          .nav-toggle {
            display: inline-block;
          }
          .nav-links {
            display: ${open ? 'flex' : 'none'};
            flex-direction: column;
            width: 100%;
            margin-top: 8px;
            align-items: flex-start;
          }
        }
      `}</style>
    </header>
  );
}
