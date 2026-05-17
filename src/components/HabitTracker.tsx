// Trigger Vercel deployment
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, BarChart3, Moon, Sun, ChevronLeft, ChevronRight, LogOut, Key, GripVertical } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface Habit {
  id: number;
  name: string;
}

interface Completions {
  [key: string]: boolean;
}

export default function HabitTracker({ session }: { session: Session }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [completions, setCompletions] = useState<Completions>({});
  const [view, setView] = useState('calendar');
  const [showYearly, setShowYearly] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [draggedHabitId, setDraggedHabitId] = useState<number | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await supabase
          .from('user_data')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          if (data.habits) setHabits(data.habits);
          if (data.completions) setCompletions(data.completions);
          if (data.dark_mode !== undefined) setDarkMode(data.dark_mode);
        }
      } catch {
        console.log('No saved data');
      }
    };
    loadData();
  }, [session.user.id]);

  const saveData = async (newHabits: Habit[], newCompletions: Completions, newDarkMode = darkMode) => {
    try {
      await supabase.from('user_data').upsert({
        user_id: session.user.id,
        habits: newHabits,
        completions: newCompletions,
        dark_mode: newDarkMode
      });
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    saveData(habits, completions, newMode);
  };

  const handleChangePassword = async () => {
    const newPassword = prompt("Enter your new password (minimum 6 characters):");
    if (newPassword) {
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        alert("Error changing password: " + error.message);
      } else {
        alert("Password successfully updated!");
      }
    }
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const updated = [...habits, { id: Date.now(), name: newHabit.toUpperCase() }];
    setHabits(updated);
    setNewHabit('');
    saveData(updated, completions);
  };

  const handleDragStart = (e: React.DragEvent, habit: Habit) => {
    setDraggedHabitId(habit.id);
    e.dataTransfer.setData('text/plain', habit.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    
    const dragEl = document.createElement('div');
    dragEl.textContent = habit.name;
    dragEl.style.position = 'absolute';
    dragEl.style.top = '-1000px';
    dragEl.style.background = darkMode ? '#18181b' : '#ffffff';
    dragEl.style.color = darkMode ? '#ffffff' : '#000000';
    dragEl.style.padding = '12px 24px';
    dragEl.style.borderRadius = '8px';
    dragEl.style.fontWeight = '900';
    dragEl.style.fontFamily = 'sans-serif';
    dragEl.style.border = `2px solid ${darkMode ? '#3f3f46' : '#e4e4e7'}`;
    dragEl.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
    dragEl.style.zIndex = '9999';
    document.body.appendChild(dragEl);
    
    e.dataTransfer.setDragImage(dragEl, 20, 20);
    setTimeout(() => { document.body.removeChild(dragEl); }, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverHabitId(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverHabitId(null);
    if (draggedHabitId === null || draggedHabitId === targetId) return;

    const newHabits = [...habits];
    const draggedIndex = newHabits.findIndex(h => h.id === draggedHabitId);
    const targetIndex = newHabits.findIndex(h => h.id === targetId);

    const [draggedItem] = newHabits.splice(draggedIndex, 1);
    newHabits.splice(targetIndex, 0, draggedItem);

    setHabits(newHabits);
    saveData(newHabits, completions);
    setDraggedHabitId(null);
  };

  const deleteHabit = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) return;
    const updated = habits.filter(h => h.id !== id);
    const newCompletions: Completions = { ...completions };
    Object.keys(newCompletions).forEach(key => {
      if (key.startsWith(`${id}-`)) delete newCompletions[key];
    });
    setHabits(updated);
    setCompletions(newCompletions);
    saveData(updated, newCompletions);
  };

  const toggleCompletion = (habitId: number, date: string) => {
    const key = `${habitId}-${date}`;
    const updated: Completions = { ...completions };
    if (updated[key]) {
      delete updated[key];
    } else {
      updated[key] = true;
    }
    setCompletions(updated);
    saveData(habits, updated);
  };

  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHabitStats = (habitId: number, targetDate = currentDate) => {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let habitCompletions = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const key = `${habitId}-${getDateString(date)}`;
      if (completions[key]) habitCompletions++;
    }

    const percentage = Math.round((habitCompletions / daysInMonth) * 100);

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const key = `${habitId}-${getDateString(checkDate)}`;
      if (completions[key]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return { habitCompletions, percentage, streak };
  };

  const getWeeklyStats = () => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date);
      let count = 0;
      habits.forEach(h => {
        if (completions[`${h.id}-${dateStr}`]) count++;
      });
      data.push({ date: dateStr.slice(-5), completed: count });
    }

    return data;
  };

  const getMonthlyStats = () => {
    const data = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = getDateString(date);
      let count = 0;
      habits.forEach(h => {
        if (completions[`${h.id}-${dateStr}`]) count++;
      });
      data.push({ date: i.toString(), completed: count });
    }
    return data;
  };

  const getYearlyStatsData = () => {
    const data = [];
    const year = currentDate.getFullYear();

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      let monthCount = 0;
      const possibleCount = habits.length * daysInMonth;

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, m, i);
        const dateStr = getDateString(date);
        habits.forEach(h => {
          if (completions[`${h.id}-${dateStr}`]) monthCount++;
        });
      }

      const percentage = possibleCount === 0 ? 0 : Math.round((monthCount / possibleCount) * 100);
      const monthName = new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short' });
      data.push({ month: monthName, completion: percentage });
    }
    return data;
  };

  const getChartData = (habitId: number) => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date);
      const completed = completions[`${habitId}-${dateStr}`] ? 1 : 0;
      data.push({ date: dateStr.slice(-5), completed });
    }

    return data;
  };

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (!showYearly) next.setDate(next.getDate() + 7);
    else next.setFullYear(next.getFullYear() + 1);
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (!showYearly) prev.setDate(prev.getDate() - 7);
    else prev.setFullYear(prev.getFullYear() - 1);
    setCurrentDate(prev);
  };

  const renderCalendarHeader = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const totalPossible = habits.length * 7;
    let completedThisWeek = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = getDateString(d);
      habits.forEach(h => {
        if (completions[`${h.id}-${dateStr}`]) completedThisWeek++;
      });
    }

    const progress = totalPossible === 0 ? 0 : Math.round((completedThisWeek / totalPossible) * 100);

    return (
      <div className={`rounded-xl p-6 mb-8 shadow-lg transition-colors ${darkMode ? 'bg-black border border-zinc-800' : 'bg-black'} text-white`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-sm font-bold mb-1 uppercase tracking-wider text-zinc-400">{showYearly ? 'Year Overview' : 'Week of'}</p>
            <h2 className="text-3xl font-black tracking-tight">
              {showYearly
                ? currentDate.getFullYear()
                : `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={prevPeriod} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft size={24} /></button>
            <button onClick={() => setShowYearly(!showYearly)} className="px-4 py-2 hover:bg-zinc-800 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest flex items-center border border-zinc-700">
              {showYearly ? 'Show Week' : 'Select Date'}
            </button>
            <button onClick={nextPeriod} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight size={24} /></button>
          </div>
        </div>
        {!showYearly && (
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">Overall Completion</span>
              <span className="font-black text-4xl leading-none">{progress}%</span>
            </div>
            <div className={`w-full bg-zinc-800 rounded-full h-4 overflow-hidden`}>
              <div className={`h-full rounded-full transition-all duration-700 ease-out bg-white`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderYearGrid = () => {
    const year = currentDate.getFullYear();
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {months.map((month, idx) => {
          const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
          const firstDay = new Date(year, month.getMonth(), 1).getDay();
          const days: (Date | null)[] = [];

          for (let i = 0; i < firstDay; i++) days.push(null);
          for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month.getMonth(), i));
          }

          return (
            <div key={idx} className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl p-4 shadow-sm`}>
              <h3 className={`text-sm font-black uppercase tracking-wider mb-3 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {month.toLocaleDateString('en-US', { month: 'long' })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <div key={d} className={`text-xs text-center font-bold uppercase ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>{d}</div>
                ))}
                {days.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const dateStr = getDateString(date);
                  let completedCount = 0;
                  habits.forEach(h => {
                    if (completions[`${h.id}-${dateStr}`]) completedCount++;
                  });
                  const intensity = habits.length > 0 ? completedCount / habits.length : 0;

                  const isToday = getDateString(new Date()) === dateStr;
                  const isSelected = getDateString(currentDate) === dateStr;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setCurrentDate(date);
                        setShowYearly(false);
                      }}
                      className={`cursor-pointer h-6 rounded text-[10px] font-bold flex items-center justify-center transition-colors hover:scale-110 ${intensity === 0
                        ? darkMode ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
                        : intensity < 0.5
                          ? darkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-300 text-zinc-700'
                          : intensity < 1
                            ? darkMode ? 'bg-zinc-500 text-white' : 'bg-zinc-500 text-white'
                            : darkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'
                        } ${isSelected ? (darkMode ? 'ring-2 ring-white' : 'ring-2 ring-black') : isToday ? (darkMode ? 'ring-1 ring-zinc-500' : 'ring-1 ring-zinc-400') : ''}`}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days: Date[] = [];
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }

    return (
      <div className="space-y-4">
        {renderCalendarHeader()}

        {showYearly ? renderYearGrid() : (
          <>
            <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl p-4 shadow-sm`}>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider">
                {days.map((day, idx) => (
                  <div key={idx} className={darkMode ? 'text-zinc-500' : 'text-zinc-400'}>
                    <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className={`text-base font-black mt-1 ${darkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{day.getDate()}</div>
                  </div>
                ))}
              </div>
            </div>

            {habits.map(habit => (
              <div 
                key={habit.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, habit)}
                onDragOver={(e) => handleDragOver(e, habit.id)}
                onDragLeave={() => setDragOverHabitId(null)}
                onDrop={(e) => handleDrop(e, habit.id)}
                onDragEnd={() => { setDraggedHabitId(null); setDragOverHabitId(null); }}
                className={`relative ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl p-4 shadow-sm transition-transform duration-200 ${draggedHabitId === habit.id ? 'scale-[0.98] ring-2 ring-zinc-500' : ''}`}
              >
                {dragOverHabitId === habit.id && draggedHabitId !== habit.id && (
                  <div className="absolute -top-2 left-0 w-full h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] z-10" />
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400 p-1 -ml-1">
                      <GripVertical size={20} />
                    </div>
                    <span className={`text-lg font-black tracking-tight uppercase ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{habit.name}</span>
                    <span className={`text-[10px] w-fit font-bold px-2 py-1 rounded-md uppercase tracking-widest ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>🔥 {getHabitStats(habit.id).streak} Day Streak</span>
                  </div>
                  <button onClick={() => deleteHabit(habit.id)} className={`${darkMode ? 'text-zinc-600 hover:text-red-500' : 'text-zinc-400 hover:text-red-500'} transition`}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, idx) => {
                    const dateStr = getDateString(day);
                    const isCompleted = completions[`${habit.id}-${dateStr}`];
                    const isToday = getDateString(new Date()) === dateStr;

                    return (
                      <button
                        key={idx}
                        onClick={() => toggleCompletion(habit.id, dateStr)}
                        className={`h-10 rounded-lg text-sm font-black transition-all transform active:scale-95 ${isCompleted
                          ? darkMode ? 'bg-zinc-100 text-zinc-900 shadow-md' : 'bg-zinc-900 text-white shadow-md'
                          : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-400'
                          } ${isToday && !isCompleted ? (darkMode ? 'ring-2 ring-zinc-500' : 'ring-2 ring-zinc-300') : ''}`}
                      >
                        {isCompleted ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const stats = habits.map(h => ({ ...h, ...getHabitStats(h.id) }));
  const weeklyData = getWeeklyStats();
  
  const getGlobalStats = () => {
    let totalCompletions = Object.keys(completions).length;
    let bestStreak = 0;
    stats.forEach(s => {
      if (s.streak > bestStreak) bestStreak = s.streak;
    });
    
    let last30Completions = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getDateString(d);
      habits.forEach(h => {
        if (completions[`${h.id}-${dateStr}`]) last30Completions++;
      });
    }
    const last30Possible = habits.length * 30;
    const last30Rate = last30Possible === 0 ? 0 : Math.round((last30Completions / last30Possible) * 100);

    return { totalCompletions, bestStreak, last30Rate, activeHabits: habits.length };
  };
  
  const globalStats = getGlobalStats();

  const chartColor = darkMode ? '#f4f4f5' : '#18181b';

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-black text-white' : 'bg-zinc-50 text-black'} transition-colors duration-300 selection:bg-zinc-500 selection:text-white`}>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-10 mt-4">
          <div>
            <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Dominate<br />Your Habits</h1>
            <p className={`text-sm md:text-base font-bold uppercase tracking-widest mt-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No Excuses. Track Progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} title="Toggle Dark Mode" className={`p-3 rounded-full border-2 transition-all transform hover:scale-105 active:scale-95 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-400'} shadow-sm`}>
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button onClick={handleChangePassword} title="Change Password" className={`p-3 rounded-full border-2 transition-all transform hover:scale-105 active:scale-95 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-blue-400 hover:border-blue-500 hover:text-blue-500' : 'bg-white border-zinc-200 text-blue-500 hover:border-blue-500'} shadow-sm`}>
              <Key size={24} />
            </button>
            <button onClick={() => supabase.auth.signOut()} title="Logout" className={`p-3 rounded-full border-2 transition-all transform hover:scale-105 active:scale-95 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-red-400 hover:border-red-500 hover:text-red-500' : 'bg-white border-zinc-200 text-red-500 hover:border-red-500'} shadow-sm`}>
              <LogOut size={24} />
            </button>
          </div>
        </header>

        <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl shadow-sm p-4 mb-8`}>
          <div className="flex gap-3">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHabit()}
              placeholder="NEW HABIT..."
              className={`flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wider border-2 rounded-xl focus:outline-none transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-zinc-500 placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 focus:border-zinc-900 placeholder-zinc-400'
                }`}
            />
            <button onClick={addHabit} className={`px-6 py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-black uppercase tracking-wider ${darkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'
              }`}>
              <Plus size={18} strokeWidth={3} /> Add
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'} border rounded-2xl shadow-sm p-12 text-center`}>
            <p className="text-xl font-black uppercase tracking-widest">Zero Habits Found.</p>
            <p className="text-sm font-bold mt-2 uppercase">Start building your discipline today.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setView('calendar')}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'calendar'
                  ? (darkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white')
                  : (darkMode ? 'bg-zinc-900 text-zinc-400 border-2 border-transparent hover:border-zinc-700' : 'bg-white text-zinc-500 border-2 border-transparent hover:border-zinc-300 shadow-sm')
                  }`}
              >
                <Calendar size={16} strokeWidth={3} /> Calendar
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'analytics'
                  ? (darkMode ? 'bg-white text-black' : 'bg-zinc-900 text-white')
                  : (darkMode ? 'bg-zinc-900 text-zinc-400 border-2 border-transparent hover:border-zinc-700' : 'bg-white text-zinc-500 border-2 border-transparent hover:border-zinc-300 shadow-sm')
                  }`}
              >
                <BarChart3 size={16} strokeWidth={3} /> Analytics
              </button>
            </div>

            {view === 'calendar' && renderWeekView()}

            {view === 'analytics' && (
              <div className="space-y-6">
                {/* Global Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-md p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Active Habits</span>
                    <span className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{globalStats.activeHabits}</span>
                  </div>
                  <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-md p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">30-Day Success</span>
                    <span className={`text-5xl font-black text-blue-500`}>{globalStats.last30Rate}%</span>
                  </div>
                  <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-md p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Best Streak</span>
                    <span className={`text-5xl font-black text-orange-500`}>🔥 {globalStats.bestStreak}</span>
                  </div>
                  <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-md p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Logged</span>
                    <span className={`text-5xl font-black text-emerald-500`}>{globalStats.totalCompletions}</span>
                  </div>
                </div>

                {/* Heatmap Section */}
                <div className={`${darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-lg p-6 md:p-8 overflow-x-auto relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${darkMode ? 'bg-emerald-500' : 'bg-emerald-300'} -translate-y-1/2 translate-x-1/3`}></div>
                  <h3 className={`text-xl font-black uppercase tracking-tight mb-8 relative z-10 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Consistency Heatmap</h3>
                  <div className="flex min-w-max gap-1 relative z-10">
                    <div className="flex flex-col gap-1 pr-2 pt-5 text-[10px] font-bold text-zinc-400 uppercase">
                      <span className="h-3"></span>
                      <span className="h-3 leading-3">Mon</span>
                      <span className="h-3"></span>
                      <span className="h-3 leading-3">Wed</span>
                      <span className="h-3"></span>
                      <span className="h-3 leading-3">Fri</span>
                      <span className="h-3"></span>
                    </div>
                    {(() => {
                      const today = new Date();
                      const startDate = new Date(today);
                      startDate.setDate(today.getDate() - 364); 
                      const firstDay = new Date(startDate);
                      firstDay.setDate(startDate.getDate() - startDate.getDay());

                      const weeks = [];
                      let current = new Date(firstDay);
                      while (current <= today || current.getDay() !== 0) {
                        if (current.getDay() === 0) weeks.push([]);
                        if (weeks.length === 0) weeks.push([]);
                        weeks[weeks.length - 1].push(new Date(current));
                        current.setDate(current.getDate() + 1);
                      }

                      return weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-1">
                          {wIdx % 4 === 0 ? (
                            <span className="text-[10px] font-bold text-zinc-400 uppercase h-4 mb-1">
                              {week[0] && week[0].getDate() <= 7 ? week[0].toLocaleDateString('en-US', { month: 'short' }) : ''}
                            </span>
                          ) : (
                            <span className="h-4 mb-1"></span>
                          )}
                          {week.map((day, dIdx) => {
                            const dateStr = getDateString(day);
                            let completedCount = 0;
                            habits.forEach(h => {
                              if (completions[`${h.id}-${dateStr}`]) completedCount++;
                            });
                            
                            const maxPossible = habits.length;
                            let intensityClass = darkMode ? 'bg-zinc-800' : 'bg-zinc-100';
                            if (maxPossible > 0 && completedCount > 0) {
                              const ratio = completedCount / maxPossible;
                              if (ratio <= 0.25) intensityClass = darkMode ? 'bg-emerald-900' : 'bg-emerald-200';
                              else if (ratio <= 0.5) intensityClass = darkMode ? 'bg-emerald-700' : 'bg-emerald-400';
                              else if (ratio <= 0.75) intensityClass = darkMode ? 'bg-emerald-600' : 'bg-emerald-500';
                              else intensityClass = darkMode ? 'bg-emerald-500' : 'bg-emerald-600';
                            }
                            
                            if (day > today) intensityClass = darkMode ? 'bg-zinc-900/30' : 'bg-zinc-50';

                            return (
                              <div
                                key={dIdx}
                                title={`${completedCount} habits completed on ${dateStr}`}
                                className={`w-3 h-3 rounded-sm transition-colors hover:ring-2 ring-zinc-400 ${intensityClass}`}
                              />
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-lg p-6 md:p-8 flex flex-col`}>
                    <h3 className={`text-lg font-black uppercase tracking-tight mb-6 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Last 7 Days Overview</h3>
                    <div className="flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                          <XAxis dataKey="date" stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <YAxis stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip
                            cursor={{ fill: darkMode ? '#27272a' : '#f4f4f5' }}
                            contentStyle={{ backgroundColor: darkMode ? '#18181b' : '#fff', borderColor: darkMode ? '#3f3f46' : '#e4e4e7', borderRadius: '12px', fontWeight: 'bold', padding: '12px' }}
                          />
                          <Bar dataKey="completed" fill={chartColor} radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Habit Breakdown */}
                  <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-3xl shadow-lg p-6 md:p-8 flex flex-col`}>
                    <h3 className={`text-lg font-black uppercase tracking-tight mb-6 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Habit Breakdown</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                      {stats.sort((a,b) => b.percentage - a.percentage).map(stat => (
                        <div key={stat.id} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{stat.name}</span>
                            <span className={`text-xs font-bold ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{stat.percentage}% / 🔥 {stat.streak} streak</span>
                          </div>
                          <div className={`w-full ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'} rounded-full h-2 overflow-hidden`}>
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${stat.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                      {stats.length === 0 && (
                        <div className="text-sm font-bold text-zinc-500 uppercase text-center mt-10">No habits added yet.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}