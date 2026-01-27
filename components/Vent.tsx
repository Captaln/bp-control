import React, { useState, useEffect } from 'react';
import { StoryList } from './confessions/StoryList';
import { ConfessionCard } from './confessions/ConfessionCard';
import { CreateConfessionModal } from './confessions/CreateConfessionModal';
import { StoryViewer } from './confessions/StoryViewer';
import { Plus } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://bp-control.vercel.app/api"
  : "/api";

export const Vent: React.FC = () => {
  // Confessions Data
  const [stories, setStories] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchConfessions();
    fetchStories();
  }, []);

  const fetchConfessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/confessions/feed?type=post`);
      const data = await res.json();
      if (Array.isArray(data)) setFeed(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchStories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/confessions/feed?type=stories`);
      const data = await res.json();
      if (Array.isArray(data)) setStories(data);
    } catch (e) { console.error(e); }
  };

  const handlePost = async (payload: any) => {
    // Get Token logic
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in to post.");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/confessions/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      if (payload.type === 'story') fetchStories();
      else fetchConfessions();
    } else {
      throw new Error(data.error);
    }
  };

  const handleStoryTap = (index: number) => {
    if (index === -1) {
      setShowCreateModal(true);
    } else {
      setViewingStoryIndex(index);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900 relative">
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto pb-20 relative">
          {/* Stories Rail */}
          <div className="pt-4 pb-2 mb-2 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
            <StoryList stories={stories} onOpen={handleStoryTap} />
          </div>

          {/* Feed */}
          <div className="px-4 space-y-4">
            {loading && <div className="text-center py-8 text-slate-400 font-medium animate-pulse">Loading tea... ☕</div>}

            {!loading && feed.length === 0 && (
              <div className="text-center py-10 opacity-50">
                <p className="text-4xl mb-2">🦗</p>
                <p className="font-bold">It's quiet in here...</p>
                <p className="text-xs">Be the first to confess!</p>
              </div>
            )}

            {feed.map((item, idx) => (
              <React.Fragment key={item.id}>
                <ConfessionCard
                  item={item}
                  onReact={() => { }}
                  onComment={() => { }}
                />
                {/* Native Ad Mockup at index 5 */}
                {idx === 5 && (
                  <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 mb-4 text-center shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Sponsored</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">"My therapist told me to download this app."</p>
                    <button className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-full font-bold shadow-sm hover:scale-105 transition">Read Their Story</button>
                  </div>
                )}
              </React.Fragment>
            ))}
            <div className="h-24"></div>
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition z-30"
          >
            <Plus size={28} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateConfessionModal
          onClose={() => setShowCreateModal(false)}
          onPost={handlePost}
        />
      )}

      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
        />
      )}
    </div>
  );
};