import React, { useEffect, useState } from 'react';
import { AppView, MoodLog } from '../types';
import { Flame, Activity, BarChart2, Play, Smile, Gamepad2, Settings, Trash2, Database, X, AlertTriangle, CheckCircle2, Shield, Mail, Lock } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [moodData, setMoodData] = useState<{ avg: number; count: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stoic quotes for daily inspiration
  const STOIC_QUOTES = [
    "For every minute you are angry you lose sixty seconds of happiness.",
    "You have power over your mind – not outside events. Realize this, and you will find strength.",
    "The soul becomes dyed with the color of its thoughts.",
    "He who angers you conquers you.",
    "Anger is an acid that does more harm to the vessel in which it is stored.",
    "Between stimulus and response there is a space. In that space is our power to choose our response.",
    "Peace is not absence of conflict, it is the ability to handle conflict by peaceful means.",
    "Holding on to anger is like grasping a hot coal – you are the one who gets burned.",
    "The greatest remedy for anger is delay.",
    "When angry, count to ten before you speak. If very angry, count to one hundred."
  ];

  const [dailyQuote] = useState(() =>
    STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)]
  );

  const loadMoodData = () => {
    try {
      const saved = localStorage.getItem('bp_mood_logs');
      if (saved) {
        const logs: MoodLog[] = JSON.parse(saved);

        // Filter for today
        const today = new Date().setHours(0, 0, 0, 0);
        const todaysLogs = logs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today);

        if (todaysLogs.length > 0) {
          const totalIntensity = todaysLogs.reduce((acc, curr) => acc + curr.intensity, 0);
          const avg = totalIntensity / todaysLogs.length;
          setMoodData({ avg, count: todaysLogs.length });
        } else {
          setMoodData(null);
        }
      } else {
        setMoodData(null);
      }
    } catch (e) {
      console.error("Error loading mood data", e);
    }
  };

  useEffect(() => {
    loadMoodData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearData = (type: 'chat' | 'mood' | 'all') => {
    if (type === 'chat') {
      localStorage.removeItem('bp_vent_history');
      showToast('Chat history cleared');
    } else if (type === 'mood') {
      localStorage.removeItem('bp_mood_logs');
      loadMoodData(); // Refresh dashboard
      showToast('Mood logs cleared');
    } else if (type === 'all') {
      localStorage.clear();
      loadMoodData();
      showToast('All app data reset');
      setTimeout(() => window.location.reload(), 1000); // Reload to reset all states
    }
  };

  const getMoodConfig = (avgIntensity: number) => {
    const percent = Math.round(avgIntensity * 10);

    if (avgIntensity <= 3) return {
      color: 'bg-green-500',
      width: `${percent}%`,
      text: 'Zen Master 🌿',
      subtext: 'Pressure is low & controlled.'
    };
    if (avgIntensity <= 5) return {
      color: 'bg-teal-400',
      width: `${percent}%`,
      text: 'Balanced 😌',
      subtext: 'Handling things well.'
    };
    if (avgIntensity <= 7) return {
      color: 'bg-orange-400',
      width: `${percent}%`,
      text: 'Rising Tension 😐',
      subtext: 'Consider a breathing exercise.'
    };
    return {
      color: 'bg-red-500',
      width: `${percent}%`,
      text: 'Critical Pressure 🤬',
      subtext: 'Venting recommended immediately!'
    };
  };

  const config = moodData ? getMoodConfig(moodData.avg) : { color: 'bg-slate-200', width: '5%', text: 'No Data Yet', subtext: 'Track your first mood.' };

  const [adminTaps, setAdminTaps] = useState(0);

  const handleHeaderTap = () => {
    const newTaps = adminTaps + 1;
    setAdminTaps(newTaps);
    if (newTaps === 7) {
      showToast("🕵️ Secret Admin Mode Unlocked!");
      onNavigate(AppView.ADMIN);
      setAdminTaps(0);
    }
  };

  return (
    <div className="h-full w-full p-6 flex flex-col justify-start items-center overflow-y-auto pb-24 relative">
      <header className="w-full mt-4 mb-8 flex justify-between items-start">
        <div onClick={handleHeaderTap} className="cursor-pointer select-none active:opacity-70 transition">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">BP Control</h1>
          <p className="text-slate-500 dark:text-slate-400">How is your pressure today?</p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white transition"
        >
          <Settings size={24} />
        </button>
      </header>

      {/* Emergency Button */}
      <button
        onClick={() => onNavigate(AppView.VENT)}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg transform transition active:scale-95 flex items-center justify-between mb-6 animate-pulse-glow"
      >
        <div className="text-left">
          <h2 className="text-2xl font-bold">I'M MAD! 🤬</h2>
          <p className="opacity-90">Quick! Tap to vent now.</p>
        </div>
        <Flame size={40} className="text-white animate-pulse" />
      </button>

      {/* Stats / Status (Real Data) */}
      <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6" onClick={() => onNavigate(AppView.TRACK)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="text-primary" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Today's Pressure</h3>
          </div>
          {moodData && <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-300">{moodData.count} logs today</span>}
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden relative border border-slate-200">
          {/* Background grid lines */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[...Array(9)].map((_, i) => <div key={i} className="w-px h-full bg-white/50"></div>)}
          </div>

          <div
            className={`h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 ${config.color}`}
            style={{ width: config.width, minWidth: '10%' }}
          >
            {moodData && (
              <span className="text-[10px] font-bold text-white/90">
                {moodData.avg.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-slate-400">{config.subtext}</p>
          <p className={`text-sm font-bold ${moodData ? 'text-slate-700' : 'text-slate-400'}`}>{config.text}</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 w-full mb-6">
        <button
          onClick={() => onNavigate(AppView.BREATHE)}
          className="bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition border border-teal-100 dark:border-teal-800"
        >
          <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
            <span className="text-2xl">🧘</span>
          </div>
          <span className="font-semibold">Relax</span>
        </button>

        <button
          onClick={() => onNavigate(AppView.LAUGH)}
          className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition border border-indigo-100 dark:border-indigo-800"
        >
          <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
            <span className="text-2xl">😂</span>
          </div>
          <span className="font-semibold">Laugh</span>
        </button>

        <button
          onClick={() => onNavigate(AppView.PLAY)}
          className="bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 transition border border-amber-100 dark:border-amber-800"
        >
          <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm">
            <Gamepad2 size={24} />
          </div>
          <span className="font-semibold">Play</span>
        </button>

        <button
          onClick={() => onNavigate(AppView.TRACK)}
          className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 border border-slate-100 dark:border-slate-700 transition"
        >
          <div className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm">
            <BarChart2 size={24} />
          </div>
          <span className="font-semibold">Track</span>
        </button>
      </div>

      {/* Trending / Featured Meme Teaser */}
      <div className="w-full mb-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 ml-1">Trending Now 🔥</h3>
        <div
          onClick={() => onNavigate(AppView.SMILE)}
          className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-md border border-slate-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer active:scale-95 transition"
        >
          <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden relative flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=150&q=80" alt="Meme thumbnail" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Play size={20} className="fill-white text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">When the code works on the first try</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Smile size={12} className="text-yellow-500" /> 1.2k people laughed at this
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 w-full">
        <p className="text-sm text-blue-800 dark:text-blue-200 text-center italic">
          "{dailyQuote}"
        </p>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:w-80 rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <button onClick={() => handleClearData('chat')} className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center gap-3 transition">
                <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm"><Trash2 size={20} /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-700 text-sm">Clear Chat History</p>
                  <p className="text-xs text-slate-400">Delete all messages</p>
                </div>
              </button>

              <button onClick={() => handleClearData('mood')} className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center gap-3 transition">
                <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm"><Activity size={20} /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-700 text-sm">Clear Mood Logs</p>
                  <p className="text-xs text-slate-400">Reset tracking stats</p>
                </div>
              </button>

              <hr className="border-slate-100 my-2" />

              <button onClick={() => handleClearData('all')} className="w-full p-4 rounded-xl bg-red-50 hover:bg-red-100 flex items-center gap-3 transition">
                <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm"><AlertTriangle size={20} /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-red-600 text-sm">Reset Everything</p>
                  <p className="text-xs text-red-400">Clear all data & restart</p>
                </div>
              </button>

              <hr className="border-slate-100 my-2" />

              {/* Privacy Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold text-sm">
                  <Shield size={16} className="text-teal-500" /> Privacy & Data
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  BP Control is a <strong>local-first</strong> app. Your chats, mood logs, and settings are stored 100% on your device. We do not track you or sell your data.
                </p>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  Note: If you delete the app or clear browser cache, your data will be lost.
                </p>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-slate-700 font-bold text-sm">
                    <Mail size={16} className="text-indigo-500" /> Feedback
                  </div>
                  <p className="text-xs text-slate-500">Found a bug? Say hi!</p>
                </div>
                <a href="mailto:avirashinz@proton.me" className="text-xs font-bold text-primary bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50">
                  Email Us
                </a>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-300">BP Control v1.0.6 (Build: {new Date().toLocaleTimeString()})</p>
            </div>
          </div>
        </div>
      )
      }

      {/* Toast Notification */}
      {
        toastMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )
      }
    </div >
  );
};