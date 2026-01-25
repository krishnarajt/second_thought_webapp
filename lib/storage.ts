import { UserSettings } from './api';

const SETTINGS_KEY = 'user_settings';
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const defaultSettings: UserSettings = {
  name: '',
  remindBeforeActivity: true,
  remindOnStart: true,
  nudgeDuringActivity: true,
  congratulateOnFinish: true,
  defaultSlotDuration: 60,
};

export function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function isLoggedIn(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) !== null;
  }
  return false;
}

export function saveSettings(settings: UserSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

export function loadSettings(): UserSettings {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  }
  return defaultSettings;
}
