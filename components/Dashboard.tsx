import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppView, MoodLog } from '../types';
import { Flame, Activity, BarChart2, Gamepad2, Settings, Trash2, X, AlertTriangle, CheckCircle2, Shield, Mail, TrendingUp, MessageSquare } from 'lucide-react';

// API CONSTANTS
const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://bp-control.vercel.app/api"
  : "/api";

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [moodData, setMoodData] = useState<{ avg: number; count: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trending Data State
  const [trending, setTrending] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Load User Stats locally
  const loadMoodData = () => {
    try {
      const saved = localStorage.getItem('bp_mood_logs');
      if (saved) {
        const logs: MoodLog[] = JSON.parse(saved);
        const today = new Date().setHours(0, 0, 0, 0);
        const todaysLogs = logs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today);
        if (todaysLogs.length > 0) {
          const totalIntensity = todaysLogs.reduce((acc, curr) => acc + curr.intensity, 0);
          setMoodData({ avg: totalIntensity / todaysLogs.length, count: todaysLogs.length });
        } else {
          setMoodData(null);
        }
      }
    } catch (e) { }
  };

  useEffect(() => {
    loadMoodData();
  }, []);

  // Fetch Real Trending Data (Latest 3 items for cleaner UI)
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/feed`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTrending(data.slice(0, 3)); // Only 3 for a horizontal scroll
        }
      } catch (e) {
        console.error("Failed to load trends");
      } finally {
        setLoadingTrends(false);
      }
    };
    fetchTrends();
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
      loadMoodData();
      showToast('Mood logs cleared');
    } else if (type === 'all') {
      localStorage.clear();
      loadMoodData();
      showToast('All app data reset');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const [adminTaps, setAdminTaps] = useState(0);
  const handleHeaderTap = () => {
    const newTaps = adminTaps + 1;
    setAdminTaps(newTaps);
    if (newTaps === 7) {
      onNavigate(AppView.ADMIN);
      setAdminTaps(0);
    }
  };

  // Helper to get tag from item id
  const getTag = (id: string) => {
    const parts = id.split('-');
    if (parts.length > 1 && isNaN(Number(parts[0]))) return parts[0].toUpperCase();
    return 'FRESH';
  };

  return (
    <div className="h-full w-full p-5 flex flex-col justify-start items-center overflow-y-auto pb-24 relative bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="w-full mt-2 mb-6 flex justify-between items-start">
        <div onClick={handleHeaderTap} className="cursor-pointer select-none">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">BP Control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">How is your pressure today?</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <Settings size={22} className="text-slate-400" />
        </button>
      </div>

      {/* Emergency Button */}
      <button
        onClick={() => onNavigate(AppView.VENT)}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between mb-4 active:scale-95 transition"
      >
        <div className="text-left">
          <h2 className="text-xl font-bold">I'M MAD! 🤬</h2>
          <p className="opacity-90 text-sm">Quick! Tap to vent now.</p>
        </div>
        <Flame size={36} className="text-white animate-pulse" />
      </button>

      {/* Today's Mood Status - Always Visible */}
      <div className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-500 flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-white font-bold text-sm">Today's Status</p>
            {moodData ? (
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Avg: {moodData.avg.toFixed(1)}/10 • {moodData.count} {moodData.count === 1 ? 'entry' : 'entries'}
              </p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-xs">Track your first mood</p>
            )}
          </div>
        </div>
        {moodData ? (
          <button onClick={() => onNavigate(AppView.TRACK)} className="text-xs text-primary font-bold">View →</button>
        ) : (
          <span className="text-xs text-slate-400 font-medium">No Data Yet</span>
        )}
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <button onClick={() => onNavigate(AppView.BREATHE)} className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl flex flex-col items-center gap-1 border border-teal-100 dark:border-teal-800">
          <span className="text-2xl">🧘</span> <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">Relax</span>
        </button>
        <button onClick={() => onNavigate(AppView.LAUGH)} className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex flex-col items-center gap-1 border border-indigo-100 dark:border-indigo-800">
          <span className="text-2xl">😂</span> <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">Laugh</span>
        </button>
        <button onClick={() => onNavigate(AppView.PLAY)} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex flex-col items-center gap-1 border border-amber-100 dark:border-amber-800">
          <Gamepad2 size={24} className="text-amber-600" /> <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">Play</span>
        </button>
        <button onClick={() => onNavigate(AppView.TRACK)} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-1 border border-slate-200 dark:border-slate-700">
          <BarChart2 size={24} className="text-slate-600 dark:text-slate-400" /> <span className="font-bold text-slate-700 dark:text-white text-sm">Track</span>
        </button>
      </div>

      {/* Trending Section - Horizontal Scroll Carousel */}
      <div className="w-full mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-slate-800 dark:text-white font-bold text-sm flex items-center gap-2">
            <TrendingUp size={14} className="text-yellow-500" />
            Trending Now
          </h3>
          <button onClick={() => onNavigate(AppView.SMILE)} className="text-xs text-primary font-bold">See All →</button>
        </div>

        {loadingTrends ? (
          <div className="text-slate-500 text-xs text-center py-4">Loading...</div>
        ) : trending.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            No trends yet. Upload something!
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
            {trending.map((item, i) => (
              <div
                key={item.id}
                onClick={() => onNavigate(AppView.SMILE)}
                className={`flex-shrink-0 ${i === 0 ? 'w-40 h-56' : 'w-28 h-40'} rounded-xl overflow-hidden relative border border-white/10 cursor-pointer active:scale-95 transition snap-start`}
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.url} className="w-full h-full object-cover" alt="Trend" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[9px] text-white font-bold uppercase tracking-wider">
                    🔥 {getTag(item.id)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings size={20} /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Clear Chat */}
              <button onClick={() => handleClearData('chat')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm"><MessageSquare size={18} /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-700 dark:text-white text-sm">Clear Chat History</p>
                  <p className="text-xs text-slate-400">Delete vent conversations</p>
                </div>
              </button>

              {/* Clear Mood */}
              <button onClick={() => handleClearData('mood')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm"><Activity size={18} /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-700 dark:text-white text-sm">Clear Mood Logs</p>
                  <p className="text-xs text-slate-400">Reset tracking stats</p>
                </div>
              </button>

              <hr className="border-slate-100 dark:border-slate-700 my-2" />

              {/* Reset All */}
              <button onClick={() => handleClearData('all')} className="w-full p-4 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 flex items-center gap-3 transition">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-red-500 shadow-sm"><AlertTriangle size={18} /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-red-600 dark:text-red-400 text-sm">Reset Everything</p>
                  <p className="text-xs text-red-400">Clear all data & restart</p>
                </div>
              </button>

              <hr className="border-slate-100 dark:border-slate-700 my-2" />

              {/* Privacy Info */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-white font-bold text-sm">
                  <Shield size={16} className="text-teal-500" /> Privacy & Data
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  BP Control is a <strong>local-first</strong> app. Your chats, mood logs, and settings are stored 100% on your device. We do not track you or sell your data.
                </p>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  Note: If you delete the app or clear browser cache, your data will be lost.
                </p>
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-slate-700 dark:text-white font-bold text-sm">
                    <Mail size={16} className="text-indigo-500" /> Feedback
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Found a bug? Say hi!</p>
                </div>
                <a href="mailto:avirashinz@proton.me" className="text-xs font-bold text-primary bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50">
                  Email Us
                </a>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-400">BP Control v2.2.0 (Build: {new Date().toLocaleTimeString()})</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-green-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};