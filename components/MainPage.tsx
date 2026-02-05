'use client';

import { useState, useEffect } from 'react';
import { TaskBlock, DailySchedule, UserSettings, generateId, saveSchedule, loadScheduleFromStorage, getScheduleFromBackend } from '@/lib/api';

interface MainPageProps {
  settings: UserSettings;
}

export default function MainPage({ settings }: MainPageProps) {
  const [tasks, setTasks] = useState<TaskBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper: Round current time up to nearest 5 minutes
  const nowBasedTaskBlock = (): TaskBlock => {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = totalMinutes % 5 === 0 ? totalMinutes : totalMinutes + (5 - totalMinutes % 5);
    
    const duration = settings.defaultSlotDuration;
    let endMinutes = startMinutes + duration;
    if (endMinutes >= 24 * 60) endMinutes = 23 * 60 + 59; // Cap at 23:59
    
    return {
      id: generateId(),
      startHour: Math.floor(startMinutes / 60),
      startMinute: startMinutes % 60,
      endHour: Math.floor(endMinutes / 60),
      endMinute: endMinutes % 60,
      task: '',
    };
  };

  // Load schedule from backend on mount and when date changes
  useEffect(() => {
    loadScheduleForDate(selectedDate);
  }, [selectedDate]);

  const loadScheduleForDate = async (date: string) => {
    setIsLoading(true);
    setAdjustError(null);
    
    try {
      const schedule = await getScheduleFromBackend(date);
      
      if (schedule && schedule.tasks.length > 0) {
        const loadedTasks = schedule.tasks.map(t => {
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
        
        // If loading today's schedule and last block ended in the past, append now-based block
        const isToday = date === new Date().toISOString().split('T')[0];
        if (isToday && loadedTasks.length > 0) {
          const last = loadedTasks[loadedTasks.length - 1];
          const lastEndMinutes = last.endHour * 60 + last.endMinute;
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          
          if (lastEndMinutes <= nowMinutes) {
            loadedTasks.push(nowBasedTaskBlock());
          }
        }
        
        setTasks(loadedTasks);
      } else {
        // Empty schedule - use now-based block only for today
        const isToday = date === new Date().toISOString().split('T')[0];
        setTasks(isToday ? [nowBasedTaskBlock()] : [{ id: generateId(), startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, task: '' }]);
      }
    } catch (error) {
      // Fallback to localStorage
      const saved = loadScheduleFromStorage(date);
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
      } else {
        const isToday = date === new Date().toISOString().split('T')[0];
        setTasks(isToday ? [nowBasedTaskBlock()] : [{ id: generateId(), startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, task: '' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    setAdjustError(null);
  };

  const deleteTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
      setSaveMessage(null);
      setAdjustError(null);
    }
  };

  // Three-case Add Timebox logic
  const addTimebox = () => {
    if (tasks.length === 0) {
      setTasks([nowBasedTaskBlock()]);
      setAdjustError(null);
      return;
    }

    const lastTask = tasks[tasks.length - 1];
    const lastEndMinutes = lastTask.endHour * 60 + lastTask.endMinute;
    
    // Case 1: Schedule reaches end of day
    if (lastEndMinutes >= 23 * 60 + 59 || lastTask.endHour === 0) {
      return; // Button should be hidden anyway
    }
    
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    const newTasks = [...tasks];
    
    // Case 2: Schedule ended in past → start from now (rounded up)
    if (lastEndMinutes <= nowMinutes) {
      newTasks.push(nowBasedTaskBlock());
    } 
    // Case 3: Schedule is in future → chain from last end
    else {
      const durationMinutes = settings.defaultSlotDuration;
      let endTotalMinutes = lastEndMinutes + durationMinutes;
      if (endTotalMinutes >= 24 * 60) endTotalMinutes = 23 * 60 + 59;
      
      newTasks.push({
        id: generateId(),
        startHour: lastTask.endHour,
        startMinute: lastTask.endMinute,
        endHour: Math.floor(endTotalMinutes / 60),
        endMinute: endTotalMinutes % 60,
        task: '',
      });
    }
    
    setTasks(newTasks);
    setSaveMessage(null);
    setAdjustError(null);
  };

  // Insert a new timebox between two blocks by stealing time from neighbors
  const insertBetween = (indexBefore: number, minutes: number) => {
    if (indexBefore < 0 || indexBefore >= tasks.length - 1) return;
    
    const taskA = tasks[indexBefore];
    const taskB = tasks[indexBefore + 1];
    
    const half = minutes / 2;
    
    const durationA = (taskA.endHour * 60 + taskA.endMinute) - (taskA.startHour * 60 + taskA.startMinute);
    const durationB = (taskB.endHour * 60 + taskB.endMinute) - (taskB.startHour * 60 + taskB.startMinute);
    
    // Guard: both neighbors must have enough duration
    if (durationA <= minutes || durationB <= minutes) {
      setAdjustError(`Not enough room — both adjacent blocks need to be longer than ${minutes} min`);
      return;
    }
    
    // Calculate new times
    const newAEndMinutes = (taskA.endHour * 60 + taskA.endMinute) - half;
    const newBStartMinutes = (taskB.startHour * 60 + taskB.startMinute) + half;
    
    const newTasks = [...tasks];
    
    // Update taskA end time
    newTasks[indexBefore] = {
      ...taskA,
      endHour: Math.floor(newAEndMinutes / 60),
      endMinute: newAEndMinutes % 60,
    };
    
    // Update taskB start time
    newTasks[indexBefore + 1] = {
      ...taskB,
      startHour: Math.floor(newBStartMinutes / 60),
      startMinute: newBStartMinutes % 60,
    };
    
    // Insert new block in the middle
    const newBlock: TaskBlock = {
      id: generateId(),
      startHour: Math.floor(newAEndMinutes / 60),
      startMinute: newAEndMinutes % 60,
      endHour: Math.floor(newBStartMinutes / 60),
      endMinute: newBStartMinutes % 60,
      task: '',
    };
    
    newTasks.splice(indexBefore + 1, 0, newBlock);
    
    setTasks(newTasks);
    setSaveMessage(null);
    setAdjustError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setAdjustError(null);

    const now = new Date();
    const dateStr = selectedDate;

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

  // Determine if Add Timebox button should be shown
  const showAddButton = tasks.length > 0 ? (() => {
    const lastTask = tasks[tasks.length - 1];
    const lastEndMinutes = lastTask.endHour * 60 + lastTask.endMinute;
    return lastEndMinutes < 23 * 60 + 59 && lastTask.endHour !== 0;
  })() : true;

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
    <div className="p-4 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Date/Time Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">{dateDisplay}</h1>
          <p className="text-sm text-gray-500">{timeDisplay}</p>
        </div>

        {/* Date Picker */}
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <button
            onClick={() => loadScheduleForDate(selectedDate)}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Loading...' : 'Load'}
          </button>
        </div>

        {/* Adjust Error Message */}
        {adjustError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{adjustError}</p>
          </div>
        )}

        {/* Task List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {tasks.map((task, index) => (
            <div key={task.id}>
              <div className="border border-gray-200 rounded-xl p-3">
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

              {/* Adjust buttons between consecutive tasks */}
              {index < tasks.length - 1 && (
                <div className="flex items-center justify-center gap-2 my-2">
                  <button
                    onClick={() => insertBetween(index, 30)}
                    className="px-4 py-1 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition"
                  >
                    Adjust 30
                  </button>
                  <button
                    onClick={() => insertBetween(index, 60)}
                    className="px-4 py-1 border border-gray-300 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition"
                  >
                    Adjust 60
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Timebox Button */}
        {showAddButton && (
          <button
            onClick={addTimebox}
            className="w-full py-3 mb-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg font-medium hover:border-indigo-500 hover:text-indigo-500 transition flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Timebox
          </button>
        )}

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
    </div>
  );
}