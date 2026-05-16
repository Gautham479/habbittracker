import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, BarChart3, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
    };
  }
}

interface Habit {
  id: number;
  name: string;
}

interface Completions {
  [key: string]: boolean;
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [completions, setCompletions] = useState<Completions>({});
  const [view, setView] = useState('calendar');
  const [showYearly, setShowYearly] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const habitsData = await window.storage?.get('habits');
        const completionsData = await window.storage?.get('completions');
        const darkModeData = await window.storage?.get('darkMode');
        if (habitsData && habitsData.value) setHabits(JSON.parse(habitsData.value));
        if (completionsData && completionsData.value) setCompletions(JSON.parse(completionsData.value));
        if (darkModeData && darkModeData.value) setDarkMode(JSON.parse(darkModeData.value));
      } catch {
        console.log('No saved data');
      }
    };
    loadData();
  }, []);

  const saveData = async (newHabits: Habit[], newCompletions: Completions) => {
    try {
      if (window.storage) {
        await window.storage.set('habits', JSON.stringify(newHabits));
        await window.storage.set('completions', JSON.stringify(newCompletions));
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      if (window.storage) {
        await window.storage.set('darkMode', JSON.stringify(newMode));
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const updated = [...habits, { id: Date.now(), name: newHabit.toUpperCase() }];
    setHabits(updated);
    setNewHabit('');
    saveData(updated, completions);
  };

  const deleteHabit = (id: number) => {
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

  const getDateString = (date: Date) => date.toISOString().split('T')[0];

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
          const days = [];

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
    const days = [];
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
              <div key={habit.id} className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl p-4 shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
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
  const monthlyData = getMonthlyStats();
  const yearlyData = getYearlyStatsData();

  const chartColor = darkMode ? '#f4f4f5' : '#18181b';

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-black text-white' : 'bg-zinc-50 text-black'} transition-colors duration-300 selection:bg-zinc-500 selection:text-white`}>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between mb-10 mt-4">
          <div>
            <h1 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Dominate<br />Your Habits</h1>
            <p className={`text-sm md:text-base font-bold uppercase tracking-widest mt-2 ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>No Excuses. Track Progress.</p>
          </div>
          <button onClick={toggleDarkMode} className={`p-3 rounded-full border-2 transition-all transform hover:scale-105 active:scale-95 ${darkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-400'} shadow-sm`}>
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map(stat => (
                    <div key={stat.id} className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl shadow-sm p-5`}>
                      <h3 className={`text-sm font-black uppercase tracking-tight mb-4 truncate ${darkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>{stat.name}</h3>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Success Rate</span>
                        <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{stat.percentage}%</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Current Streak</span>
                        <span className={`text-xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{stat.streak}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl shadow-sm p-6`}>
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-6 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Last 7 Days Overview</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                      <XAxis dataKey="date" stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: darkMode ? '#27272a' : '#f4f4f5' }}
                        contentStyle={{ backgroundColor: darkMode ? '#18181b' : '#fff', borderColor: darkMode ? '#3f3f46' : '#e4e4e7', borderRadius: '8px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="completed" fill={chartColor} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl shadow-sm p-6`}>
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-6 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Monthly Progress (Completions per Day)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                      <XAxis dataKey="date" stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: darkMode ? '#27272a' : '#f4f4f5' }}
                        contentStyle={{ backgroundColor: darkMode ? '#18181b' : '#fff', borderColor: darkMode ? '#3f3f46' : '#e4e4e7', borderRadius: '8px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="completed" fill={chartColor} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl shadow-sm p-6`}>
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-6 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Yearly Overview (% Completion per Month)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                      <XAxis dataKey="month" stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                      <YAxis stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: darkMode ? '#27272a' : '#f4f4f5' }}
                        contentStyle={{ backgroundColor: darkMode ? '#18181b' : '#fff', borderColor: darkMode ? '#3f3f46' : '#e4e4e7', borderRadius: '8px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="completion" fill={chartColor} radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {habits.map(habit => (
                  <div key={habit.id} className={`${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-xl shadow-sm p-6`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-lg font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{habit.name}</h3>
                      <button onClick={() => deleteHabit(habit.id)} className={`${darkMode ? 'text-zinc-600 hover:text-red-500' : 'text-zinc-400 hover:text-red-500'} transition`}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={getChartData(habit.id)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#27272a' : '#e4e4e7'} vertical={false} />
                        <XAxis dataKey="date" stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 1]} stroke={darkMode ? '#71717a' : '#a1a1aa'} style={{ fontSize: '12px', fontWeight: 'bold' }} tickLine={false} axisLine={false} ticks={[0, 1]} tickFormatter={(val) => val === 1 ? 'YES' : 'NO'} />
                        <Tooltip
                          contentStyle={{ backgroundColor: darkMode ? '#18181b' : '#fff', borderColor: darkMode ? '#3f3f46' : '#e4e4e7', borderRadius: '8px', fontWeight: 'bold' }}
                        />
                        <Line type="stepAfter" dataKey="completed" stroke={chartColor} strokeWidth={3} dot={{ fill: chartColor, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}