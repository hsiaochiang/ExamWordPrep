import { AppData, UserSettings } from './jsonSchema';

const APP_KEY = 'wordsite:appdata';

export function loadAppData(): AppData {
  const raw = localStorage.getItem(APP_KEY);
  if (!raw) {
    return {
      users: [
        {
          username: 'admin',
          password: 'admin',
          isAdmin: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: null
        }
      ],
      records: [],
      userSettings: []
    };
  }
  try {
    return JSON.parse(raw) as AppData;
  } catch (e) {
    console.warn('LocalStorage 資料格式錯誤，重置為預設', e);
    localStorage.removeItem(APP_KEY);
    return loadAppData();
  }
}

export function saveAppData(data: AppData) {
  localStorage.setItem(APP_KEY, JSON.stringify(data));
}

export function upsertUserSettings(settings: UserSettings, data: AppData): AppData {
  const idx = data.userSettings.findIndex(s => s.username === settings.username);
  if (idx >= 0) {
    data.userSettings[idx] = settings;
  } else {
    data.userSettings.push(settings);
  }
  return data;
}
