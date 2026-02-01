// ==========================================
// CHANGE THIS TO YOUR BACKEND URL
// ==========================================
const BASE_URL = 'https://second-thought.krishnarajthadesar.in/api';

// ==========================================
// DEV BYPASS - Set to false for production
// ==========================================
export const DEV_BYPASS_LOGIN = false;
// ==========================================

// Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface UserSettings {
  name: string;
  remindBeforeActivity: boolean;
  remindOnStart: boolean;
  nudgeDuringActivity: boolean;
  congratulateOnFinish: boolean;
  defaultSlotDuration: number;
  telegramLinked?: boolean;
}

export interface TelegramLinkResponse {
  code: string;
  expiresAt: string;
  message: string;
}

export interface TaskBlock {
  id: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  task: string;
}

export interface TaskBlockJson {
  id: string;
  startTime: string;
  endTime: string;
  task: string;
}

export interface DailySchedule {
  date: string;
  createdAt: string;
  updatedAt: string;
  tasks: TaskBlockJson[];
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}

// Duration options
export const durationOptions = [
  { minutes: 15, label: '15 minutes' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 45, label: '45 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1.5 hours' },
  { minutes: 120, label: '2 hours' },
];

// Helper to get auth header
const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// API Functions
export async function login(username: string, password: string): Promise<AuthResponse> {
  if (DEV_BYPASS_LOGIN) {
    return { accessToken: 'dev_token', refreshToken: 'dev_refresh', message: 'Dev mode' };
  }
  
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function signup(username: string, password: string): Promise<AuthResponse> {
  if (DEV_BYPASS_LOGIN) {
    return { accessToken: 'dev_token', refreshToken: 'dev_refresh', message: 'Dev mode' };
  }
  
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) throw new Error('Signup failed');
  return res.json();
}

export async function updateSettings(settings: UserSettings): Promise<ApiResponse> {
  if (DEV_BYPASS_LOGIN) {
    return { success: true, message: 'Saved locally (dev mode)' };
  }
  
  try {
    const res = await fetch(`${BASE_URL}/user/settings`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify({
        name: settings.name,
        remindBeforeActivity: settings.remindBeforeActivity,
        remindOnStart: settings.remindOnStart,
        nudgeDuringActivity: settings.nudgeDuringActivity,
        congratulateOnFinish: settings.congratulateOnFinish,
        defaultSlotDuration: settings.defaultSlotDuration,
      }),
    });
    
    if (!res.ok) return { success: true, message: 'Saved locally' };
    return res.json();
  } catch {
    return { success: true, message: 'Saved locally (offline)' };
  }
}

export async function saveSchedule(schedule: DailySchedule): Promise<ApiResponse> {
  // Save to localStorage
  localStorage.setItem(`schedule_${schedule.date}`, JSON.stringify(schedule));
  
  // Also trigger download
  // downloadScheduleJson(schedule);
  
  if (DEV_BYPASS_LOGIN) {
    return { success: true, message: 'Saved locally (dev mode)' };
  }
  
  try {
    const res = await fetch(`${BASE_URL}/schedule/save`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ schedule }),
    });
    
    if (!res.ok) return { success: true, message: 'Saved locally (offline)' };
    return { success: true, message: 'Synced to server' };
  } catch {
    return { success: true, message: 'Saved locally (offline)' };
  }
}

export function loadScheduleFromStorage(date: string): DailySchedule | null {
  const data = localStorage.getItem(`schedule_${date}`);
  return data ? JSON.parse(data) : null;
}

function downloadScheduleJson(schedule: DailySchedule) {
  const jsonString = JSON.stringify(schedule, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedule_${schedule.date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get user settings including Telegram status
export async function getSettings(): Promise<UserSettings> {
  if (DEV_BYPASS_LOGIN) {
    return {
      name: 'Dev User',
      remindBeforeActivity: true,
      remindOnStart: true,
      nudgeDuringActivity: true,
      congratulateOnFinish: true,
      defaultSlotDuration: 60,
      telegramLinked: false,
    };
  }
  
  try {
    const res = await fetch(`${BASE_URL}/user/settings`, {
      method: 'GET',
      headers: getAuthHeader(),
    });
    
    if (!res.ok) throw new Error('Failed to get settings');
    return res.json();
  } catch {
    // Return default settings if offline
    return {
      name: '',
      remindBeforeActivity: true,
      remindOnStart: true,
      nudgeDuringActivity: true,
      congratulateOnFinish: true,
      defaultSlotDuration: 60,
      telegramLinked: false,
    };
  }
}

// Get Telegram link code
export async function getTelegramLinkCode(): Promise<TelegramLinkResponse> {
  if (DEV_BYPASS_LOGIN) {
    return {
      code: 'DEV123',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      message: 'Dev mode - use code DEV123',
    };
  }
  
  const res = await fetch(`${BASE_URL}/user/telegram/link`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  
  if (!res.ok) throw new Error('Failed to get link code');
  return res.json();
}

// Unlink Telegram account
export async function unlinkTelegram(): Promise<ApiResponse> {
  if (DEV_BYPASS_LOGIN) {
    return { success: true, message: 'Telegram unlinked (dev mode)' };
  }
  
  const res = await fetch(`${BASE_URL}/user/telegram/unlink`, {
    method: 'POST',
    headers: getAuthHeader(),
  });
  
  if (!res.ok) throw new Error('Failed to unlink Telegram');
  return res.json();
}