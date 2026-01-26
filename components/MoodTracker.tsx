import React, { useState, useEffect } from 'react';
import { BarChart2, Calendar, Check, TrendingUp, AlertCircle, Save, Sparkles, X, Loader2 } from 'lucide-react';
import { MoodLog } from '../types';
import { getMoodInsights } from '../services/geminiService';

export const MoodTracker: React.FC = () => {
  const [view, setView] = useState<'log' | 'history'>('log');
  const [logs, setLogs] = useState<MoodLog[]>([]);
  
  // Insights State
  const [showInsights, setShowInsights] = useState(false);
  const [insightResult, setInsightResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Form State
  const [intensity, setIntensity] = useState(5);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [coping, setCoping] = useState<string[]>([]);
  
  const PREDEFINED_TRIGGERS = ['Work', 'Family', 'Traffic', 'Tech Issues', 'Tired', 'Hungry', 'Noise', 'Disrespect', 'Other'];
  const PREDEFINED_COPING = ['Deep Breaths', 'Venting', 'Walk', 'Music', 'Meditation', 'Game', 'Screaming', 'Nap'];

  useEffect(() => {
    const saved = localStorage.getItem('bp_mood_logs');
    if (saved) {
      try {
        setLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
  }, []);

  const saveLog = () => {
    const newLog: MoodLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      intensity,
      triggers,
      coping
    };
    
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('bp_mood_logs', JSON.stringify(updatedLogs));
    
    // Reset form
    setIntensity(5);
    setTriggers([]);
    setCoping([]);
    setView('history');
  };

  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const getIntensityColor = (level: number) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-600';
  };

  const handleAnalyze = async () => {
    if (logs.length < 3) return; // Should be handled by button disabled state but double check
    setAnalyzing(true);
    setShowInsights(true);
    setInsightResult(null);
    
    const result = await getMoodInsights(logs);
    setInsightResult(result);
    setAnalyzing(false);
  };

  const renderChart = () => {
    // Generate Last 7 Days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Map logs to days
    const chartData = last7Days.map(date => {
        const dayLogs = logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.setHours(0,0,0,0) === date.getTime();
        });

        // If no logs, we assume "0" anger (Calm), which rewards the user visually
        if (dayLogs.length === 0) return { date, avg: 0, hasData: false };

        const total = dayLogs.reduce((acc, curr) => acc + curr.intensity, 0);
        return { 
            date, 
            avg: total / dayLogs.length,
            hasData: true
        };
    });

    const width = 100;
    const height = 50;
    const padding = 5;
    const graphHeight = height - padding * 2;
    const graphWidth = width - padding * 2;

    // Calculate SVG Points
    const points = chartData.map((d, i) => {
        const x = padding + (i / 6) * graphWidth;
        // 0 intensity = bottom (height - padding), 10 intensity = top (padding)
        const y = height - (padding + (d.avg / 10) * graphHeight);
        return `${x},${y}`;
    }).join(' ');
    
    // Close the path for the area fill
    const areaPath = `
        ${padding},${height - padding} 
        ${points} 
        ${width - padding},${height - padding}
    `;

    return (
        <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
            <div className="flex justify-between items-end mb-4">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    Last 7 Days
                </h4>
                <div className="flex gap-3 text-[10px] text-slate-400 font-medium">
                     <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>High</span>
                     <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>Calm</span>
                 </div>
            </div>
            
            <div className="relative w-full aspect-[2/1]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#f1f5f9" strokeWidth="0.5" />

                    {/* Area Fill */}
                    <polyline points={areaPath} fill="url(#fillGradient)" />

                    {/* The Line */}
                    <polyline 
                        points={points} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />

                    {/* Data Dots */}
                    {chartData.map((d, i) => {
                         const x = padding + (i / 6) * graphWidth;
                         const y = height - (padding + (d.avg / 10) * graphHeight);
                         return (
                             <circle 
                                key={i} 
                                cx={x} 
                                cy={y} 
                                r={d.hasData ? 2 : 1.5} 
                                fill="white" 
                                stroke={d.hasData ? (d.avg > 7 ? '#ef4444' : d.avg > 4 ? '#f59e0b' : '#22c55e') : '#cbd5e1'}
                                strokeWidth="1.5"
                             />
                         );
                    })}
                </svg>
                
                {/* X-Axis Labels (Days) */}
                <div className="flex justify-between mt-2 px-1">
                    {chartData.map((d, i) => (
                        <span key={i} className={`text-[9px] font-bold w-4 text-center ${i === 6 ? 'text-slate-800' : 'text-slate-300'}`}>
                            {d.date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderLogForm = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Intensity Slider */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700">Anger Level</h3>
          <span className={`px-3 py-1 rounded-full text-white font-bold ${getIntensityColor(intensity)}`}>
            {intensity}/10
          </span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={intensity} 
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Calm</span>
          <span>Annoyed</span>
          <span>Furious</span>
        </div>
      </div>

      {/* Triggers */}
      <div>
        <h3 className="font-bold text-slate-700 mb-3">What triggered it?</h3>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TRIGGERS.map(t => (
            <button
              key={t}
              onClick={() => toggleSelection(t, triggers, setTriggers)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                triggers.includes(t) 
                  ? 'bg-slate-800 text-white shadow-md transform scale-105' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Coping */}
      <div>
        <h3 className="font-bold text-slate-700 mb-3">How did you cope?</h3>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_COPING.map(c => (
            <button
              key={c}
              onClick={() => toggleSelection(c, coping, setCoping)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                coping.includes(c) 
                  ? 'bg-teal-600 text-white shadow-md transform scale-105' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={saveLog}
        className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-sky-600 active:scale-95 transition flex items-center justify-center gap-2"
      >
        <Save size={20} />
        Save Entry
      </button>
    </div>
  );

  const renderHistory = () => {
    const avgIntensity = logs.length > 0 
      ? (logs.reduce((acc, curr) => acc + curr.intensity, 0) / logs.length).toFixed(1)
      : '0';

    // Calculate top trigger
    const triggerCounts: Record<string, number> = {};
    logs.flatMap(l => l.triggers).forEach(t => triggerCounts[t] = (triggerCounts[t] || 0) + 1);
    const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Visual Graph */}
        {renderChart()}

        {/* AI Insight Button */}
        {logs.length >= 3 ? (
            <button 
                onClick={handleAnalyze}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition flex items-center justify-center gap-2 group"
            >
                <Sparkles size={20} className="group-hover:animate-spin" />
                Analyze My Patterns
            </button>
        ) : (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl text-center">
                <p className="text-violet-700 text-sm font-medium">Log {3 - logs.length} more entries to unlock AI Insights!</p>
            </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs uppercase font-bold">Avg Intensity</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{avgIntensity}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 text-slate-400 mb-1">
              <AlertCircle size={16} />
              <span className="text-xs uppercase font-bold">Top Trigger</span>
            </div>
            <p className="text-xl font-bold text-slate-800 truncate">{topTrigger}</p>
          </div>
        </div>

        {/* List */}
        <div>
          <h3 className="font-bold text-slate-700 mb-4">Recent Logs</h3>
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-100 rounded-xl border border-dashed border-slate-300">
              <p>No logs yet.</p>
              <button onClick={() => setView('log')} className="text-primary mt-2 underline">Track your first mood</button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                  <div className={`w-2 h-full rounded-full self-stretch ${getIntensityColor(log.intensity)}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <div className="font-bold text-slate-800 mt-1">
                           Intensity: {log.intensity}/10
                        </div>
                      </div>
                    </div>
                    
                    {log.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {log.triggers.map(t => (
                          <span key={t} className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded-full font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                     {log.coping.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {log.coping.map(c => (
                          <span key={c} className="text-[10px] px-2 py-1 bg-teal-50 text-teal-600 rounded-full font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col p-6 pb-24 overflow-y-auto relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mood Tracker</h2>
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button 
            onClick={() => setView('log')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'log' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
          >
            Log
          </button>
           <button 
            onClick={() => setView('history')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'history' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
          >
            History
          </button>
        </div>
      </div>

      {view === 'log' ? renderLogForm() : renderHistory()}

      {/* Insights Modal */}
      {showInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white relative">
                    <button 
                        onClick={() => setShowInsights(false)}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles size={24} className="text-yellow-300" /> Pattern Detective
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">AI-powered analysis of your logs</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl">🕵️</span>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">Connecting the dots...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-indigo text-slate-700 leading-relaxed">
                            <div className="whitespace-pre-wrap">{insightResult}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!analyzing && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <p className="text-xs text-center text-slate-400">
                            Generated by BP Control AI • Not medical advice
                        </p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};