import React from 'react';
import { AppView } from '../types';
import { Grid3X3, Hammer, Waves, ArrowRight, Beaker, BrainCircuit, X, Zap, Anchor } from 'lucide-react';
import { trackGameStart } from '../services/analytics';

interface PlayProps {
    onNavigate: (view: AppView) => void;
}

// Map of view to game name for analytics
const GAME_NAMES: Record<string, string> = {
    [AppView.GAME_GROUNDING]: 'grounding',
    [AppView.GAME_POPIT]: 'popit',
    [AppView.GAME_SMASH]: 'smash',
    [AppView.GAME_WHACK]: 'whack',
    [AppView.GAME_SORT]: 'sort',
    [AppView.GAME_MATCH]: 'match',
    [AppView.GAME_TICTACTOE]: 'tictactoe',
    [AppView.GAME_ZEN]: 'zen',
};

export const Play: React.FC<PlayProps> = ({ onNavigate }) => {
    // Wrapper that tracks game start before navigating
    const playGame = (view: AppView) => {
        const gameName = GAME_NAMES[view] || 'unknown';
        trackGameStart(gameName);
        onNavigate(view);
    };

    return (
        <div className="h-full w-full bg-slate-50 p-6 flex flex-col pb-24 overflow-y-auto">
            <header className="mb-6 mt-2">
                <h1 className="text-2xl font-bold text-slate-800">Play & Escape</h1>
                <p className="text-slate-500 text-sm">Distract your mind, reset your mood.</p>
            </header>

            <div className="space-y-4">
                {/* Grounding Card - Prominently Placed */}
                <button
                    onClick={() => playGame(AppView.GAME_GROUNDING)}
                    className="w-full bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 rounded-2xl shadow-md border border-slate-600 flex items-center justify-between group active:scale-95 transition-all mb-2"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Anchor size={24} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-white">5-4-3-2-1 Grounding</h3>
                            <p className="text-xs text-slate-300">Panic attack relief</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-white transition-colors" />
                </button>

                {/* Pop It Card */}
                <button
                    onClick={() => playGame(AppView.GAME_POPIT)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Grid3X3 size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Pop It</h3>
                            <p className="text-xs text-slate-400">Satisfying bubble wrap</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>

                {/* Smash It Card */}
                <button
                    onClick={() => playGame(AppView.GAME_SMASH)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <Hammer size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Smash It</h3>
                            <p className="text-xs text-slate-400">Break stuff, virtually</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>

                {/* Whack-A-Mood Card */}
                <button
                    onClick={() => playGame(AppView.GAME_WHACK)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                            <Zap size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Whack-a-Mood</h3>
                            <p className="text-xs text-slate-400">Bust bad vibes fast</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>

                {/* Liquid Logic Card */}
                <button
                    onClick={() => playGame(AppView.GAME_SORT)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Beaker size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Liquid Logic</h3>
                            <p className="text-xs text-slate-400">Sort color bottles</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>

                {/* Memory Match Card */}
                <button
                    onClick={() => playGame(AppView.GAME_MATCH)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <BrainCircuit size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Mind Match</h3>
                            <p className="text-xs text-slate-400">Find emoji pairs</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>

                {/* Tic Tac Toe Card */}
                <button
                    onClick={() => playGame(AppView.GAME_TICTACTOE)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <X size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Tic Tac Toe</h3>
                            <p className="text-xs text-slate-400">Classic distraction</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>

                {/* Zen Flow Card (Fixed Styling) */}
                <button
                    onClick={() => playGame(AppView.GAME_ZEN)}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Waves size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-700">Zen Flow</h3>
                            <p className="text-xs text-slate-400">Hypnotic particles</p>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </button>
            </div>
        </div>
    );
};
