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
          const isActive = pathname === link.to;
          const classes = ['nav-item', link.emphasis ? 'highlight' : '', locked ? 'disabled' : '', isActive ? 'active' : '']
            .filter(Boolean)
            .join(' ');
          const hint = locked
            ? '請先建立單字範圍'
            : link.to === '/dashboard'
              ? '建立或調整本回合單字'
              : '已可使用';
          return (
            <Link
              key={link.to}
              to={link.to}
              className={classes}
              aria-disabled={locked}
              onClick={event => {
                if (locked) {
                  event.preventDefault();
                  return;
                }
                setOpen(false);
              }}
            >
              <span className="nav-label">
                {link.emphasis && <span className="nav-icon" aria-hidden>★</span>}
                {link.label}
              </span>
              <span className={`nav-sub ${locked ? 'alert' : ''}`}>
                {locked ? `（${hint}）` : hint}
              </span>
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
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
          text-decoration: none;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 10px 14px;
          background: #ffffff;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .nav-item:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }
        .nav-item.active {
          border-color: #93c5fd;
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
        }
        .nav-item.highlight {
          border-color: #c7d2fe;
          background: #eef2ff;
        }
        .nav-item.disabled {
          border-style: dashed;
          color: #9ca3af;
          pointer-events: none;
          background: #f9fafb;
        }
        .nav-label {
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .nav-sub {
          font-size: 12px;
          color: #64748b;
        }
        .nav-sub.alert { color: #b91c1c; }
        .nav-icon {
          color: #f97316;
          font-size: 14px;
        }
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
            align-items: stretch;
            background: #fff;
            border-radius: 12px;
            padding: 12px;
          }
          .nav-item {
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}
