import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppView, MoodLog } from '../types';
import { Flame, Activity, BarChart2, Gamepad2, Settings, Trash2, X, AlertTriangle, CheckCircle2, Shield, Mail, TrendingUp, MessageSquare, Wind, Smile, Sparkles, Zap, ArrowRight, Upload } from 'lucide-react';
import { getUserProfile } from '../lib/profile';

// API CONSTANTS
const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://bp-control.vercel.app/api"
  : "/api";

// Mini Jokes/Quotes Array
const MINI_JOKES = [
  "Deep breaths. Shallow graves are illegal. 😤",
  "You're doing great. The bar is low. 🏆",
  "Hydrate or diedrate 💧",
  "Plot twist: You survive this too.",
  "Therapy is expensive. Screaming is free. 🗣️",
  "Chaos is just spicy peace ✨",
  "You handled 100% of your bad days. Legend.",
  "Coffee: Because adulting is hard ☕",
  "Your vibe attracts your tribe 🔥",
  "Ctrl+Alt+Del your stress 💻",
  "Mercury is in retrograde. Blame that.",
  "Inhale tacos, exhale negativity 🌮",
  "Be the energy you want to attract ⚡",
  "Life update: still figuring it out.",
  "Sending good vibes... please hold 📞"
];

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [moodData, setMoodData] = useState<{ avg: number; count: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentJoke, setCurrentJoke] = useState(0);

  // (Just viewing Dashboard content to find tracking points)
  // Trending Data State
  const [trending, setTrending] = useState<any[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);

  // Creator Mode State
  const [isCreator, setIsCreator] = useState(false);
  const [username, setUsername] = useState('Guest');

  // Check if user is a creator on mount & get username
  useEffect(() => {
    const checkProfile = async () => {
      const profile = await getUserProfile();
      if (profile) {
        setUsername(profile.username);
        if (profile.is_creator) {
          setIsCreator(true);
        }
      }
    };
    checkProfile();
  }, []);

  // Rotate jokes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentJoke((prev) => (prev + 1) % MINI_JOKES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  // Fetch Real Trending Data
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/feed`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTrending(data.slice(0, 3));
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

  const getTag = (id: string) => {
    const parts = id.split('-');
    if (parts.length > 1 && isNaN(Number(parts[0]))) return parts[0].toUpperCase();
    return 'FRESH';
  };

  const getMoodEmoji = () => {
    if (!moodData) return '😶';
    if (moodData.avg <= 3) return '😌';
    if (moodData.avg <= 5) return '😐';
    if (moodData.avg <= 7) return '😤';
    return '🤬';
  };

  // Helper functions for new Status Card (adapted from original moodData logic)
  const getMoodColor = (mood: string) => {
    if (!moodData) return 'from-gray-400 to-gray-600';
    if (moodData.avg <= 3) return 'from-green-400 to-green-600';
    if (moodData.avg <= 5) return 'from-yellow-400 to-yellow-600';
    if (moodData.avg <= 7) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getMoodIcon = (mood: string) => {
    return getMoodEmoji(); // Reusing existing emoji logic
  };

  const todayMood = moodData; // Alias for clarity with new structure
  const stats = {
    avgIntensity: moodData?.avg.toFixed(1) || 'N/A',
    totalLogs: moodData?.count || 0,
  };

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div onClick={handleHeaderTap} className="cursor-pointer select-none flex-1 min-w-0 mr-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Welcome back,</p>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{username}</span>
            <Zap className="text-yellow-500 fill-current flex-shrink-0" size={20} />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Creator Upload Button - only shows for creators */}
          {isCreator && (
            <button
              onClick={() => onNavigate(AppView.CREATOR)}
              className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 border border-indigo-400/50 rounded-xl shadow-lg shadow-indigo-500/20"
            >
              <Upload size={20} className="text-white" />
            </button>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl">
            <Settings size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Spaced Content Area */}
      <div className="flex-1 flex flex-col justify-evenly gap-4">

        {/* Daily Vibe */}
        <div className="w-full bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-4 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-violet-400" size={14} />
            <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Daily Vibe</span>
          </div>
          <p className="text-white font-medium text-sm transition-opacity duration-500">
            {MINI_JOKES[currentJoke]}
          </p>
        </div>

        {/* Emergency Button */}
        <button
          onClick={() => onNavigate(AppView.VENT)}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-red-500/20 flex-shrink-0"
        >
          <div className="text-left">
            <h2 className="text-xl font-black">I'M MAD! 🤬</h2>
            <p className="opacity-90 text-sm font-medium">Tap to vent with others</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Flame size={28} className="text-white animate-pulse" />
          </div>
        </button>

        {/* Confessions Teaser Widget */}
        <div
          onClick={() => onNavigate(AppView.VENT)}
          className="w-full bg-indigo-900/30 border border-indigo-500/30 rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition flex-shrink-0 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
            <MessageSquare size={64} className="text-white transform rotate-12" />
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
            🤫
          </div>
          <div className="flex-1 relative z-10">
            <div className="flex justify-between items-start">
              <h3 className="text-white font-bold text-sm">Fresh Tea Spilled ☕</h3>
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">NEW</span>
            </div>
            <p className="text-indigo-200 text-xs mt-1 truncate">"I just rejected a proposal because..."</p>
            <p className="text-[10px] text-indigo-400 mt-1">Read 5 new confessions</p>
          </div>
        </div>

        {/* Status Card */}
        <div
          onClick={() => onNavigate(AppView.TRACK)}
          className="w-full bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.98] transition flex-shrink-0"
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/30 bg-gradient-to-br ${getMoodColor(todayMood?.avg ? 'mood' : 'neutral')}`}>
              <span className="drop-shadow-md">
                {getMoodIcon(todayMood?.avg ? 'mood' : 'neutral')}
              </span>
            </div>
            <div>
              <h3 className="text-white font-bold">Today's Status</h3>
              {moodData ? (
                <p className="text-slate-400 text-sm">
                  Avg: <span className="text-cyan-400 font-bold">{stats.avgIntensity}/10</span> • {stats.totalLogs} {stats.totalLogs === 1 ? 'log' : 'logs'}
                </p>
              ) : (
                <p className="text-slate-500 text-sm">Tap to log your first mood</p>
              )}
            </div>
          </div>
          <ArrowRight className="text-slate-500" size={18} />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-2 w-full flex-shrink-0">
          <button onClick={() => onNavigate(AppView.BREATHE)} className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
            <Wind size={22} className="text-teal-400" />
            <span className="text-teal-400 text-[10px] font-bold">Relax</span>
          </button>

          {/* UPDATED: Smile Button routing to new Smile page */}
          <button onClick={() => onNavigate(AppView.SMILE)} className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
            <Smile size={22} className="text-yellow-400" />
            <span className="text-yellow-400 text-[10px] font-bold">Smile</span>
          </button>

          <button onClick={() => onNavigate(AppView.PLAY)} className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
            <Gamepad2 size={22} className="text-orange-400" />
            <span className="text-orange-400 text-[10px] font-bold">Play</span>
          </button>
          <button onClick={() => onNavigate(AppView.TRACK)} className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex flex-col items-center gap-1 active:scale-95 transition">
            <BarChart2 size={22} className="text-blue-400" />
            <span className="text-blue-400 text-[10px] font-bold">Track</span>
          </button>
        </div>

        {/* Trending Memes Preview */}
        <div className="w-full flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <TrendingUp size={14} className="text-pink-500" />
              Trending Memes
            </h3>
            <button onClick={() => onNavigate(AppView.SMILE)} className="text-xs text-pink-400 font-bold">See All →</button>
          </div>

          {loadingTrends ? (
            <div className="text-slate-500 text-xs text-center py-4">Loading...</div>
          ) : trending.length === 0 ? (
            <div className="text-slate-500 text-xs text-center py-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
              No trends yet. Be first! 🚀
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
              {trending.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(AppView.SMILE)}
                  className={`flex-shrink-0 ${i === 0 ? 'w-36 h-48' : 'w-24 h-32'} rounded-xl overflow-hidden relative border border-white/5 cursor-pointer active:scale-95 transition snap-start shadow-lg`}
                >
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" alt="Trend" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-2">
                    <span className="text-[9px] text-white font-bold uppercase tracking-wider bg-pink-500/80 px-1.5 py-0.5 rounded">
                      {getTag(item.id)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Full Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 duration-300 max-h-[85vh] overflow-y-auto border-t border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              <button onClick={() => handleClearData('chat')} className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center gap-3 transition">
                <div className="p-2 bg-slate-700 rounded-lg"><MessageSquare size={18} className="text-slate-300" /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white text-sm">Clear Chat History</p>
                  <p className="text-xs text-slate-500">Delete vent conversations</p>
                </div>
              </button>

              <button onClick={() => handleClearData('mood')} className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center gap-3 transition">
                <div className="p-2 bg-slate-700 rounded-lg"><Activity size={18} className="text-slate-300" /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white text-sm">Clear Mood Logs</p>
                  <p className="text-xs text-slate-500">Reset tracking stats</p>
                </div>
              </button>

              <hr className="border-slate-700 my-2" />

              <button onClick={() => handleClearData('all')} className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-3 transition">
                <div className="p-2 bg-red-500/20 rounded-lg"><AlertTriangle size={18} className="text-red-400" /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-red-400 text-sm">Reset Everything</p>
                  <p className="text-xs text-red-400/60">Clear all data & restart</p>
                </div>
              </button>

              <hr className="border-slate-700 my-2" />

              <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-white font-bold text-sm">
                    <Mail size={16} className="text-violet-400" /> Feedback
                  </div>
                  <p className="text-xs text-slate-500">Found a bug?</p>
                </div>
                <a href="mailto:avirashinz@proton.me" className="text-xs font-bold text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">
                  Email Us
                </a>
              </div>

              <button onClick={() => onNavigate(AppView.TERMS)} className="w-full mt-3 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center gap-3 transition">
                <div className="p-2 bg-slate-700 rounded-lg"><Shield size={18} className="text-slate-300" /></div>
                <div className="text-left flex-1">
                  <p className="font-bold text-white text-sm">Terms & Legal</p>
                  <p className="text-xs text-slate-500">Read our policies</p>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-600">BP Control v2.5 (Guest Fix)</p>
            </div>
          </div>
        </div >
      )}

      {/* Toast Notification */}
      {
        toastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-700">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )
      }
    </div >
  );
};