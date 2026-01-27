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

  // Ad Config
  const [adFreq, setAdFreq] = useState(10); // Default

  useEffect(() => {
    fetchConfessions();
    fetchStories();
    // Fetch Ad Config
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('admin_config').select('value').eq('key', 'ad_feed_frequency').single()
        .then(({ data }) => { if (data) setAdFreq(parseInt(data.value) || 10); });
    });
  }, []);

  // ... fetchConfessions ... select queries ...

  // ... render ...
  {
    feed.map((item, idx) => (
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
    ))
  }
  <div className="h-24"></div>
          </div >

  {/* FAB */ }
  < button
onClick = {() => setShowCreateModal(true)}
className = "absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition z-30"
  >
  <Plus size={28} />
          </button >
        </div >
      </div >

  {/* Modals */ }
{
  showCreateModal && (
    <CreateConfessionModal
      onClose={() => setShowCreateModal(false)}
      onPost={handlePost}
    />
  )
}

{
  viewingStoryIndex !== null && (
    <StoryViewer
      stories={stories}
      initialIndex={viewingStoryIndex}
      onClose={() => setViewingStoryIndex(null)}
    />
  )
}
    </div >
  );
};