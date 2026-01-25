'use client';

import { useState, useEffect } from 'react';
import { UserSettings, durationOptions, updateSettings } from '@/lib/api';

interface SettingsPageProps {
  settings: UserSettings;
  onSettingsUpdate: (settings: UserSettings) => void;
  onLogout: () => void;
}

export default function SettingsPage({ settings, onSettingsUpdate, onLogout }: SettingsPageProps) {
  const [name, setName] = useState(settings.name);
  const [remindBefore, setRemindBefore] = useState(settings.remindBeforeActivity);
  const [remindOnStart, setRemindOnStart] = useState(settings.remindOnStart);
  const [nudgeDuring, setNudgeDuring] = useState(settings.nudgeDuringActivity);
  const [congratulate, setCongratulate] = useState(settings.congratulateOnFinish);
  const [slotDuration, setSlotDuration] = useState(settings.defaultSlotDuration);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setName(settings.name);
    setRemindBefore(settings.remindBeforeActivity);
    setRemindOnStart(settings.remindOnStart);
    setNudgeDuring(settings.nudgeDuringActivity);
    setCongratulate(settings.congratulateOnFinish);
    setSlotDuration(settings.defaultSlotDuration);
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    
    const newSettings: UserSettings = {
      name,
      remindBeforeActivity: remindBefore,
      remindOnStart,
      nudgeDuringActivity: nudgeDuring,
      congratulateOnFinish: congratulate,
      defaultSlotDuration: slotDuration,
    };
    
    await updateSettings(newSettings);
    onSettingsUpdate(newSettings);
    setSaveSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto overflow-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Settings</h1>

      {/* Profile Section */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-indigo-500 mb-4">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaveSuccess(false); }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Schedule Section */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-indigo-500 mb-4">Schedule</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Time Block Duration</label>
          <select
            value={slotDuration}
            onChange={(e) => { setSlotDuration(Number(e.target.value)); setSaveSuccess(false); }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white"
            disabled={isLoading}
          >
            {durationOptions.map((option) => (
              <option key={option.minutes} value={option.minutes}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-indigo-500 mb-4">Notifications</h2>
        
        <div className="space-y-4">
          <CheckboxItem
            checked={remindBefore}
            onChange={(v) => { setRemindBefore(v); setSaveSuccess(false); }}
            title="Remind 10 minutes prior"
            subtitle="Get notified before each activity starts"
            disabled={isLoading}
          />
          
          <CheckboxItem
            checked={remindOnStart}
            onChange={(v) => { setRemindOnStart(v); setSaveSuccess(false); }}
            title="Remind on start of activity"
            subtitle="Get notified when it's time to begin"
            disabled={isLoading}
          />
          
          <CheckboxItem
            checked={nudgeDuring}
            onChange={(v) => { setNudgeDuring(v); setSaveSuccess(false); }}
            title="Nudge during activity"
            subtitle="Get a gentle reminder midway through"
            disabled={isLoading}
          />
          
          <CheckboxItem
            checked={congratulate}
            onChange={(v) => { setCongratulate(v); setSaveSuccess(false); }}
            title="Congratulate on finishing"
            subtitle="Celebrate when you complete a task"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <p className="text-sm text-indigo-500 mb-4">Settings saved successfully!</p>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading || !name.trim()}
        className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center mb-12"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          'Save'
        )}
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full py-3 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition flex items-center justify-center gap-2 mb-8"
      >
        <span>🚪</span>
        Log Out
      </button>
    </div>
  );
}

interface CheckboxItemProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

function CheckboxItem({ checked, onChange, title, subtitle, disabled }: CheckboxItemProps) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
      />
      <div className="flex-1">
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </label>
  );
}
