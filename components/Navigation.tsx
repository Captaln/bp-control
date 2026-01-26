import React from 'react';
import { Home, Wind, MessageSquareX, Smile, BarChart2, Gamepad2 } from 'lucide-react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const getButtonClass = (view: AppView) => {
    const isActive = currentView === view;
    return `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
      }`;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center px-1 z-50 shadow-lg pb-safe">
      <button onClick={() => onNavigate(AppView.DASHBOARD)} className={getButtonClass(AppView.DASHBOARD)}>
        <Home size={22} />
        <span className="text-[10px] font-medium">Home</span>
      </button>
      <button onClick={() => onNavigate(AppView.VENT)} className={getButtonClass(AppView.VENT)}>
        <MessageSquareX size={22} />
        <span className="text-[10px] font-medium">Vent</span>
      </button>
      <button onClick={() => onNavigate(AppView.BREATHE)} className={getButtonClass(AppView.BREATHE)}>
        <Wind size={22} />
        <span className="text-[10px] font-medium">Breathe</span>
      </button>
      <button onClick={() => onNavigate(AppView.PLAY)} className={getButtonClass(AppView.PLAY)}>
        <Gamepad2 size={22} />
        <span className="text-[10px] font-medium">Play</span>
      </button>
      <button onClick={() => onNavigate(AppView.TRACK)} className={getButtonClass(AppView.TRACK)}>
        <BarChart2 size={22} />
        <span className="text-[10px] font-medium">Track</span>
      </button>
      <button onClick={() => onNavigate(AppView.SMILE)} className={getButtonClass(AppView.SMILE)}>
        <Smile size={22} />
        <span className="text-[10px] font-medium">Smile</span>
      </button>
    </div>
  );
};