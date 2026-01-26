import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Vent } from './components/Vent';
import { Breathe } from './components/Breathe';
import { Laugh } from './components/Laugh';
import { Play } from './components/Play';
import { MoodTracker } from './components/MoodTracker';
import { Navigation } from './components/Navigation';
import { AppView } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case AppView.VENT:
        return <Vent />;
      case AppView.BREATHE:
        return <Breathe />;
      case AppView.PLAY:
        return <Play />;
      case AppView.LAUGH:
        return <Laugh />;
      case AppView.TRACK:
        return <MoodTracker />;
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