import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Vent } from './components/Vent';
import { Breathe } from './components/Breathe';
import { Laugh } from './components/Laugh';
import { Play } from './components/Play';
import { MoodTracker } from './components/MoodTracker';
import { Navigation } from './components/Navigation';
import { AppView } from './types';

import { App as CapacitorApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
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
import { CreatorUpload } from './components/CreatorUpload';

// Analytics
import { startSession, endSession, trackTabView } from './services/analytics';
import { getAnonymousId } from './lib/profile';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [deepLinkMemeId, setDeepLinkMemeId] = useState<string | null>(null);

  useEffect(() => {
    // Check for Deep Link on Mount
    const params = new URLSearchParams(window.location.search);
    const memeId = params.get('meme');
    if (memeId) {
      setDeepLinkMemeId(memeId);
      setCurrentView(AppView.LAUGH);
    }
  }, []);

  // Initialize Push Notifications
  useEffect(() => {
    const initPush = async () => {
      try {
        // Request permission
        const permission = await PushNotifications.requestPermissions();

        if (permission.receive === 'granted') {
          // Register with Apple / Google
          await PushNotifications.register();
        }
      } catch (error) {
        console.error('Push registration failed:', error);
      }
    };

    // Listeners
    const addListeners = async () => {
      await PushNotifications.removeAllListeners();

      // Registration success
      await PushNotifications.addListener('registration', async ({ value: token }) => {
        console.log('Push Token:', token);

        // Send to our backend
        try {
          const deviceId = getAnonymousId();
          const platform = (await CapacitorApp.getInfo()).name || 'android'; // 'android' or 'ios'

          await fetch('https://bp-control-chat.vercel.app/api/push/register', { // using relative path in prod, but full URL safe
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              device_id: deviceId,
              platform: 'android' // forcing android for now since we are building APK
            })
          });
        } catch (e) {
          console.error('Error sending token to backend', e);
        }
      });

      // Registration Error
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error: ', error.error);
      });

      // Show notification if app is open
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });

      // Handle notification click
      await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        console.log('Push action performed: ', notification);
        // Navigate if data says so
        const data = notification.data;
        if (data.view) {
          // Basic routing logic
          if (data.view === 'smile') setCurrentView(AppView.SMILE);
          if (data.view === 'play') setCurrentView(AppView.PLAY);
        }
      });
    };

    initPush();
    addListeners();

  }, []);

  // Analytics: Start session on app mount
  useEffect(() => {
    startSession();

    // End session when app goes to background or closes
    const stateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        endSession();
      } else {
        startSession(); // New session when coming back
      }
    });

    return () => {
      endSession();
      stateListener.then(h => h.remove());
    };
  }, []);

  // Analytics: Track tab/view changes
  useEffect(() => {
    trackTabView(currentView);
  }, [currentView]);

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
        return <Vent />;
      case AppView.BREATHE:
        return <Breathe />;
      case AppView.PLAY:
        return <Play onNavigate={setCurrentView} />;
      case AppView.LAUGH:
        return <Laugh initialMemeId={deepLinkMemeId} />;
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
      case AppView.CREATOR:
        return <CreatorUpload onClose={() => setCurrentView(AppView.DASHBOARD)} />;

      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900 relative max-w-md mx-auto shadow-2xl overflow-hidden pt-[env(safe-area-inset-top,20px)]">
      {/* App Content */}
      <main className="flex-1 overflow-hidden relative">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <Navigation currentView={currentView} onNavigate={(view) => {
        setDeepLinkMemeId(null); // Clear deep link so we go back to full feed
        setCurrentView(view);
      }} />
    </div>
  );
}

export default App;