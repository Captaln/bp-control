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

  // Ad Config
  const [adFreq, setAdFreq] = useState(10); // Default

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchConfessions();
    fetchStories();
    // Fetch Ad Config
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('admin_config').select('value').eq('key', 'ad_feed_frequency').single()
        .then(({ data }) => { if (data) setAdFreq(parseInt(data.value) || 10); });
    });
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
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Vent</h1>
          <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span> */}
          </button>
        </div>

        <div className="h-full overflow-y-auto pb-24 pt-14"> {/* Added top padding for header */}
          {/* Stories Rail */}
          <div className="pt-2 pb-2 mb-2 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50">
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
                {/* Dynamic Ad Injection */}
                {(idx + 1) % adFreq === 0 && (
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
        </div>

        {/* FAB - Moved Outside ScrollView */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="absolute bottom-24 right-5 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition z-30"
        >
          <Plus size={28} />
        </button>
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