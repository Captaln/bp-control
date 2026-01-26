import React, { useEffect, useState } from 'react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { AppView, MoodLog } from '../types';
import { Flame, Activity, BarChart2, Play, Smile, Gamepad2, Settings, Trash2, Database, X, AlertTriangle, CheckCircle2, Shield, Mail, Lock, TrendingUp, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

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
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bp_mood_logs');
      if (saved) {
        const logs: MoodLog[] = JSON.parse(saved);
        const today = new Date().setHours(0, 0, 0, 0);
        const todaysLogs = logs.filter(log => new Date(log.timestamp).setHours(0, 0, 0, 0) === today);
        if (todaysLogs.length > 0) {
          const totalIntensity = todaysLogs.reduce((acc, curr) => acc + curr.intensity, 0);
          setMoodData({ avg: totalIntensity / todaysLogs.length, count: todaysLogs.length });
        }
      }
    } catch (e) { }
  }, []);

  // Fetch Real Trending Data (Latest 4 items)
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/feed`);
        const data = await res.json();
        if (Array.isArray(data)) {
          // Take first 4 items (assuming backend returns newest first, or we sort here)
          const latest = data.slice(0, 4);
          setTrending(latest);
        }
      } catch (e) {
        console.error("Failed to load trends");
      } finally {
        setLoadingTrends(false);
      }
    };
    fetchTrends();
  }, []);

  const [adminTaps, setAdminTaps] = useState(0);
  const handleHeaderTap = () => {
    const newTaps = adminTaps + 1;
    setAdminTaps(newTaps);
    if (newTaps === 7) {
      onNavigate(AppView.ADMIN);
      setAdminTaps(0);
    }
  };

  return (
    <div className="h-full w-full p-6 flex flex-col justify-start items-center overflow-y-auto pb-24 relative bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="w-full mt-4 mb-8 flex justify-between items-start">
        <div onClick={handleHeaderTap} className="cursor-pointer select-none">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">BP Control</h1>
          <p className="text-slate-500 dark:text-slate-400">How is your pressure today?</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
          <Settings size={24} className="text-slate-400" />
        </button>
      </div>

      {/* Emergency Button */}
      <button
        onClick={() => onNavigate(AppView.VENT)}
        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl p-6 shadow-lg flex items-center justify-between mb-8 active:scale-95 transition"
      >
        <div className="text-left">
          <h2 className="text-2xl font-bold">I'M MAD! 🤬</h2>
          <p className="opacity-90">Quick! Tap to vent now.</p>
        </div>
        <Flame size={40} className="text-white animate-pulse" />
      </button>

      {/* Apps Grid */}
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <button onClick={() => onNavigate(AppView.BREATHE)} className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl flex flex-col items-center gap-2 border border-teal-100 dark:border-teal-800">
          <span className="text-2xl">🧘</span> <span className="font-bold text-teal-700 dark:text-teal-300">Relax</span>
        </button>
        <button onClick={() => onNavigate(AppView.LAUGH)} className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex flex-col items-center gap-2 border border-indigo-100 dark:border-indigo-800">
          <span className="text-2xl">😂</span> <span className="font-bold text-indigo-700 dark:text-indigo-300">Laugh</span>
        </button>
        <button onClick={() => onNavigate(AppView.PLAY)} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex flex-col items-center gap-2 border border-amber-100 dark:border-amber-800">
          <Gamepad2 size={24} className="text-amber-600" /> <span className="font-bold text-amber-700 dark:text-amber-300">Play</span>
        </button>
        <button onClick={() => onNavigate(AppView.TRACK)} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 border border-slate-200 dark:border-slate-700">
          <BarChart2 size={24} className="text-slate-600 dark:text-slate-400" /> <span className="font-bold text-slate-700 dark:text-white">Track</span>
        </button>
      </div>

      {/* Real Trending Section */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <TrendingUp size={16} className="text-yellow-500" />
            Trending Now
          </h3>
          <span className="text-xs text-slate-500">Global Feed</span>
        </div>

        {loadingTrends ? (
          <div className="text-slate-500 text-sm text-center py-4">Loading trends...</div>
        ) : trending.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-6 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
            <p>No trends yet today.</p>
            <p className="text-xs opacity-50 mt-1">Upload something in the secret menu!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trending.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate(AppView.SMILE)} // Go to feed
                className="aspect-square bg-slate-800 rounded-xl overflow-hidden relative border border-white/5 cursor-pointer active:scale-95 transition"
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover opacity-80" muted />
                ) : (
                  <img src={item.url} className="w-full h-full object-cover opacity-80" alt="Trend" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] text-white font-medium truncate w-full uppercase tracking-wider">
                    {/* Extract Tag safely */}
                    🔥 {isNaN(Number(item.id.split('-')[0])) ? item.id.split('-')[0] : 'FRESH'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal (Simplified) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl dark:text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)}><X className="dark:text-white" /></button>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-300">BP Control v2.1.0 (Build: {new Date().toLocaleTimeString()})</p>
              <button onClick={() => { localStorage.clear(); window.location.reload() }} className="text-red-500 font-bold text-sm bg-red-50 p-3 rounded-xl w-full">
                Reset App Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};