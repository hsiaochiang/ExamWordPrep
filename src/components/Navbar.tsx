import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useWordSet } from '../store/WordSetContext';

const links = [
  { to: '/dashboard', label: '單字範圍選擇' },
  { to: '/words', label: '單字總覽', requiresSession: true },
  { to: '/flashcards', label: '學習卡', emphasis: true, requiresSession: true },
  { to: '/quiz', label: '測驗', emphasis: true, requiresSession: true },
  { to: '/history', label: '歷史紀錄' },
  { to: '/settings', label: '設定' }
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { pathname } = useLocation();
  const { sessionWords } = useWordSet();
  const [open, setOpen] = useState(false);
  const isAdmin = currentUser?.isAdmin;
  const navMenuId = useId();
  const userInitial = currentUser ? currentUser.username.charAt(0).toUpperCase() : '';
  const hasSession = sessionWords.length > 0;

  return (
    <header className="nav">
      <div className="nav-brand">
        <Link to="/dashboard">會考單字學習網站</Link>
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setOpen(!open)}
          aria-label="切換選單"
          aria-expanded={open}
          aria-controls={navMenuId}
        >
          ☰
        </button>
      </div>
      <nav id={navMenuId} className={`nav-links ${open ? 'open' : ''}`}>
        {links.map(link => {
          const locked = Boolean(link.requiresSession && !hasSession);
          const linkClass = [pathname === link.to ? 'active' : '', link.emphasis ? 'highlight' : '', locked ? 'disabled' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <Link
              key={link.to}
              to={link.to}
              className={linkClass}
              aria-disabled={locked}
              onClick={event => {
                if (locked) {
                  event.preventDefault();
                  return;
                }
                setOpen(false);
              }}
            >
              {link.emphasis && <span className="nav-icon" aria-hidden>★</span>}
              {link.label}
              {locked && <span className="nav-lock">（請先建立單字範圍）</span>}
            </Link>
          );
        })}
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
        {currentUser && (
          <div className="nav-user" aria-label={`目前登入：${currentUser.username}${currentUser.isAdmin ? '（管理者）' : ''}`}>
            <span className="nav-avatar" aria-hidden>{userInitial}</span>
            <div>
              <div className="nav-username">{currentUser.username}</div>
              {currentUser.isAdmin && <div className="nav-role">管理者</div>}
            </div>
          </div>
        )}
        <button className="btn secondary" type="button" onClick={() => logout()} style={{ marginLeft: 8 }}>
          登出
        </button>
      </nav>
      {!hasSession && (
        <div className="nav-hint">
          提醒：請先在「單字範圍選擇」建立本回合單字，才能使用單字總覽、學習卡與測驗功能。
        </div>
      )}
      <button
        className={`nav-overlay ${open ? 'visible' : ''}`}
        type="button"
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        tabIndex={-1}
      />
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
        .nav-links a.highlight {
          border: 1px solid #c7d2fe;
          background: #eef2ff;
          font-weight: 600;
        }
        .nav-links a.disabled {
          color: #9ca3af;
          border-color: transparent;
          pointer-events: none;
        }
        .nav-icon {
          margin-right: 4px;
          color: #f97316;
          font-size: 14px;
        }
        .nav-lock { display: block; font-size: 11px; color: #9ca3af; }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #f8fafc;
        }
        .nav-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #4f46e5;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .nav-username { font-size: 14px; font-weight: 600; }
        .nav-role { font-size: 12px; color: #4b5563; }
        .nav-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          opacity: 0;
          pointer-events: none;
          border: none;
        }
        .nav-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .nav-hint {
          margin-top: 4px;
          font-size: 13px;
          color: #6b7280;
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
            background: #fff;
            border-radius: 12px;
            padding: 12px;
          }
        }
      `}</style>
    </header>
  );
}
