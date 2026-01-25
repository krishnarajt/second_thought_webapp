'use client';

import { useState, useEffect } from 'react';
import { DEV_BYPASS_LOGIN } from '@/lib/api';
import { isLoggedIn, saveTokens, clearTokens, loadSettings, saveSettings, defaultSettings } from '@/lib/storage';
import LoginPage from '@/components/LoginPage';
import SignupPage from '@/components/SignupPage';
import MainPage from '@/components/MainPage';
import SettingsPage from '@/components/SettingsPage';
import BottomNav from '@/components/BottomNav';
import { login, signup, UserSettings } from '@/lib/api';

type Page = 'login' | 'signup' | 'main' | 'settings';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check login status on mount
  useEffect(() => {
    const loggedIn = DEV_BYPASS_LOGIN || isLoggedIn();
    if (loggedIn) {
      setCurrentPage('main');
    }
    setSettings(loadSettings());
    setIsInitialized(true);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await login(username, password);
      saveTokens(response.accessToken, response.refreshToken);
      setCurrentPage('main');
    } catch (e) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await signup(username, password);
      saveTokens(response.accessToken, response.refreshToken);
      setCurrentPage('main');
    } catch (e) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    setSettings(defaultSettings);
    setCurrentPage('login');
  };

  const handleSettingsUpdate = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Don't render until we've checked login status
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Auth pages (no bottom nav)
  if (currentPage === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateToSignup={() => { setError(null); setCurrentPage('signup'); }}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignupPage
        onSignup={handleSignup}
        onNavigateToLogin={() => { setError(null); setCurrentPage('login'); }}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // Main app pages (with bottom nav)
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-auto pb-20">
        {currentPage === 'main' && (
          <MainPage settings={settings} />
        )}
        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onSettingsUpdate={handleSettingsUpdate}
            onLogout={handleLogout}
          />
        )}
      </div>
      <BottomNav
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page as Page)}
      />
    </div>
  );
}
