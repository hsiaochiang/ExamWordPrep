import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppData, RecordItem, User, UserSettings } from '../utils/jsonSchema';
import { loadAppData, saveAppData, upsertUserSettings } from '../utils/localStorageHelpers';
import { nanoid } from 'nanoid';

type AuthContextValue = {
  currentUser: User | null;
  appData: AppData;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => { ok: boolean; message?: string };
  logout: () => void;
  updateAppData: (updater: (data: AppData) => AppData) => void;
  upsertSettings: (settings: UserSettings) => void;
  addRecord: (record: Omit<RecordItem, 'sessionId'>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('wordsite:currentUser');
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const login = (username: string, password: string) => {
    const user = appData.users.find(u => u.username === username && u.password === password);
    if (!user) return false;
    const updatedUser: User = { ...user, lastLoginAt: new Date().toISOString() };
    const updatedUsers = appData.users.map(u => (u.username === user.username ? updatedUser : u));
    const next = { ...appData, users: updatedUsers };
    setAppData(next);
    setCurrentUser(updatedUser);
    localStorage.setItem('wordsite:currentUser', JSON.stringify(updatedUser));
    return true;
  };

  const register = (username: string, password: string) => {
    if (!username.trim()) return { ok: false, message: '帳號不可為空' };
    if (appData.users.some(u => u.username === username)) return { ok: false, message: '帳號已存在' };
    const now = new Date().toISOString();
    const newUser: User = {
      username,
      password,
      isAdmin: false,
      createdAt: now,
      lastLoginAt: now
    };
    const next = { ...appData, users: [...appData.users, newUser] };
    setAppData(next);
    setCurrentUser(newUser);
    localStorage.setItem('wordsite:currentUser', JSON.stringify(newUser));
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('wordsite:currentUser');
  };

  const updateAppData = (updater: (data: AppData) => AppData) => {
    setAppData(prev => updater({ ...prev, users: [...prev.users], records: [...prev.records], userSettings: [...prev.userSettings] }));
  };

  const upsertSettings = (settings: UserSettings) => {
    updateAppData(data => upsertUserSettings(settings, data));
  };

  const addRecord = (record: Omit<RecordItem, 'sessionId'>) => {
    const sessionId = `${record.username}-${nanoid(6)}`;
    const item: RecordItem = { ...record, sessionId };
    updateAppData(data => ({ ...data, records: [item, ...data.records] }));
  };

  const value: AuthContextValue = {
    currentUser,
    appData,
    login,
    register,
    logout,
    updateAppData,
    upsertSettings,
    addRecord
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext not ready');
  return ctx;
}
