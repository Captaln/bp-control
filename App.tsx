import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { GlobalChat } from './components/GlobalChat';
import { Breathe } from './components/Breathe';
import { Laugh } from './components/Laugh';
import { Play } from './components/Play';
import { MoodTracker } from './components/MoodTracker';
import { Navigation } from './components/Navigation';
import { AppView } from './types';

import { App as CapacitorApp } from '@capacitor/app';
import { BubbleWrap } from './components/BubbleWrap';
import { SmashIt } from './components/SmashIt';
import { ZenFlow } from './components/ZenFlow';
import { ColorSort } from './components/ColorSort';
import { MemoryMatch } from './components/MemoryMatch';
import { TicTacToe } from './components/TicTacToe';
import { WhackAMood } from './components/WhackAMood';
import { Grounding } from './components/Grounding';
import { Smile as SmileView } from './components/Smile';
import { AdminDashboard } from './components/AdminDashboard';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  useEffect(() => {
    // Handle Hardware Back Button
    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (currentView === AppView.DASHBOARD) {
        CapacitorApp.exitApp();
      } else if (currentView.startsWith('GAME_')) {
        setCurrentView(AppView.PLAY);
      } else {
        setCurrentView(AppView.DASHBOARD);
      }
    });

    return () => {
      backListener.then(h => h.remove());
    };
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case AppView.VENT:
        return <GlobalChat />;
      case AppView.BREATHE:
        return <Breathe />;
      case AppView.PLAY:
        return <Play onNavigate={setCurrentView} />;
      case AppView.LAUGH:
        return <Laugh />;
      case AppView.TRACK:
        return <MoodTracker />;

      // Games
      case AppView.GAME_GROUNDING:
        return <Grounding onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_POPIT:
        return <BubbleWrap onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_SMASH:
        return <SmashIt onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_ZEN:
        return <ZenFlow onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_SORT:
        return <ColorSort onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_MATCH:
        return <MemoryMatch onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_TICTACTOE:
        return <TicTacToe onBack={() => setCurrentView(AppView.PLAY)} />;
      case AppView.GAME_WHACK:
        return <WhackAMood onBack={() => setCurrentView(AppView.PLAY)} />;

      // New Features
      case AppView.SMILE:
        return <SmileView />;
      case AppView.ADMIN:
        return <AdminDashboard onNavigate={setCurrentView} />;

      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900 relative max-w-md mx-auto shadow-2xl overflow-hidden">
      {/* App Content */}
      <main className="flex-1 overflow-hidden relative">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <Navigation currentView={currentView} onNavigate={setCurrentView} />
    </div>
  );
}

export default App;