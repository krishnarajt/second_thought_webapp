'use client';

import { useState, useEffect } from 'react';
import { TaskBlock, DailySchedule, UserSettings, generateId, saveSchedule, loadScheduleFromStorage } from '@/lib/api';

interface MainPageProps {
  settings: UserSettings;
}

export default function MainPage({ settings }: MainPageProps) {
  const [tasks, setTasks] = useState<TaskBlock[]>([
    { id: generateId(), startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, task: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load today's schedule on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = loadScheduleFromStorage(today);
    if (saved && saved.tasks.length > 0) {
      const loadedTasks = saved.tasks.map(t => {
        const [startH, startM] = t.startTime.split(':').map(Number);
        const [endH, endM] = t.endTime.split(':').map(Number);
        return {
          id: t.id,
          startHour: startH,
          startMinute: startM,
          endHour: endH,
          endMinute: endM,
          task: t.task,
        };
      });
      setTasks(loadedTasks);
    }
  }, []);

  const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatDisplayTime = (hour: number, minute: number): string => {
    const adjustedHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const amPm = hour < 12 ? 'AM' : 'PM';
    return `${adjustedHour}:${minute.toString().padStart(2, '0')} ${amPm}`;
  };

  const parseTime = (timeString: string): { hour: number; minute: number } => {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute };
  };

  const updateTask = (index: number, updates: Partial<TaskBlock>) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    
    // Auto-add new block if typing in the last one
    if (index === newTasks.length - 1 && updates.task && updates.task.length > 0) {
      const lastTask = newTasks[newTasks.length - 1];
      // Don't add if end time is midnight or 23:59
      if (!(lastTask.endHour === 0 || (lastTask.endHour === 23 && lastTask.endMinute >= 59))) {
        const durationMinutes = settings.defaultSlotDuration;
        const startTotalMinutes = lastTask.endHour * 60 + lastTask.endMinute;
        let endTotalMinutes = startTotalMinutes + durationMinutes;
        
        if (endTotalMinutes >= 24 * 60) {
          endTotalMinutes = 23 * 60 + 59;
        }
        
        newTasks.push({
          id: generateId(),
          startHour: lastTask.endHour,
          startMinute: lastTask.endMinute,
          endHour: Math.floor(endTotalMinutes / 60),
          endMinute: endTotalMinutes % 60,
          task: '',
        });
      }
    }
    
    setTasks(newTasks);
    setSaveMessage(null);
  };

  const deleteTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
      setSaveMessage(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const schedule: DailySchedule = {
      date: dateStr,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      tasks: tasks
        .filter(t => t.task.trim())
        .map(t => ({
          id: t.id,
          startTime: formatTime(t.startHour, t.startMinute),
          endTime: formatTime(t.endHour, t.endMinute),
          task: t.task,
        })),
    };
    
    const result = await saveSchedule(schedule);
    setSaveMessage(result.message || 'Saved!');
    setIsSaving(false);
  };

  // Get current date/time display
  const now = new Date();
  const dateDisplay = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeDisplay = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  const hasValidTasks = tasks.some(t => t.task.trim());

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Date/Time Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">{dateDisplay}</h1>
        <p className="text-sm text-gray-500">{timeDisplay}</p>
      </div>

      {/* Task List */}
      <div className="space-y-3 mb-6">
        {tasks.map((task, index) => (
          <div key={task.id} className="border border-gray-200 rounded-xl p-3">
            {/* Time Row */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="time"
                value={formatTime(task.startHour, task.startMinute)}
                onChange={(e) => {
                  const { hour, minute } = parseTime(e.target.value);
                  updateTask(index, { startHour: hour, startMinute: minute });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={formatTime(task.endHour, task.endMinute)}
                onChange={(e) => {
                  const { hour, minute } = parseTime(e.target.value);
                  updateTask(index, { endHour: hour, endMinute: minute });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              {tasks.length > 1 && (
                <button
                  onClick={() => deleteTask(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  🗑️
                </button>
              )}
            </div>
            
            {/* Task Input */}
            <input
              type="text"
              value={task.task}
              onChange={(e) => updateTask(index, { task: e.target.value })}
              placeholder="What's the plan?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        ))}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <p className="text-sm text-indigo-500 mb-4 text-center">{saveMessage}</p>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !hasValidTasks}
        className="w-full py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        {isSaving ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          'Save Schedule'
        )}
      </button>
    </div>
  );
}
