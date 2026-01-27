import React, { useState, useEffect } from 'react';
import { Heart, Share2, Bookmark, Download, Play, Pause, Volume2, VolumeX, Tag, Flag } from 'lucide-react';
import { Meme } from '../types';

// Mock Data Service (In a real app, this comes from your Admin Backend)
const MOCK_MEMES: Meme[] = [];

export const Laugh: React.FC<{ initialMemeId?: string | null }> = ({ initialMemeId }) => {
  // State
  const [memes, setMemes] = useState<Meme[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'saved'>('feed');
  const [activeCategory, setActiveCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ad Config
  const [adFreq, setAdFreq] = useState(10); // Default

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // 0. Fetch Ad Config
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('admin_config').select('value').eq('key', 'ad_feed_frequency').single()
        .then(({ data }) => { if (data) setAdFreq(parseInt(data.value) || 10); });
    });

    // 1. Fetch from Real API
    let url = '/api/feed';
    if (initialMemeId) {
      url += `?id=${initialMemeId}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Transform if needed
          const mapped = data.map((item: any) => ({
            id: item.id || Math.random().toString(),
            type: item.type || 'image',
            url: item.url,
            title: item.category || 'Meme', // Fallback
            description: item.description || '',
            likes: item.likes || 0,
            category: item.category || 'General'
          }));

          if (initialMemeId && mapped.length > 0) {
            // If deep link, show only that one or put it first? 
            // API returns only that one if ?id is passed.
            console.log("Loaded Deep Linked Meme:", mapped);
          }

          setMemes(mapped);
        }
      })
      .catch(err => console.error("Feed fetch failed", err));

    // 2. Load interactions from LocalStorage
    const savedLikes = localStorage.getItem('bp_liked_memes');
    if (savedLikes) setLikedIds(JSON.parse(savedLikes));

    const savedSaves = localStorage.getItem('bp_saved_memes');
    if (savedSaves) setSavedIds(JSON.parse(savedSaves));
  }, [initialMemeId]);

  const CATEGORIES = ['All', 'Work Humor', 'Animal Antics', 'Relatable', 'Tech Life'];

  const toggleLike = (id: string) => {
    let newLikes;
    if (likedIds.includes(id)) {
      newLikes = likedIds.filter(lid => lid !== id);
    } else {
      newLikes = [...likedIds, id];
    }
    setLikedIds(newLikes);
    localStorage.setItem('bp_liked_memes', JSON.stringify(newLikes));
  };

  const toggleSave = (id: string) => {
    let newSaved;
    if (savedIds.includes(id)) {
      newSaved = savedIds.filter(sid => sid !== id);
    } else {
      newSaved = [...savedIds, id];
    }
    setSavedIds(newSaved);
    localStorage.setItem('bp_saved_memes', JSON.stringify(newSaved));
  };

  const handleShare = async (meme: Meme) => {
    const shareUrl = `${window.location.origin}?meme=${meme.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BP Control Meme',
          text: meme.title,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      alert('Share feature not supported on this browser, but URL copied!');
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleDownload = (meme: Meme) => {
    // Basic download simulation for demo purposes
    // In production, you'd fetch the blob to avoid CORS issues or open in new tab
    const link = document.createElement('a');
    link.href = meme.url;
    link.target = '_blank';
    link.download = `meme-${meme.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedMemes = (activeTab === 'feed'
    ? memes
    : memes.filter(m => savedIds.includes(m.id))
  ).filter(m => activeCategory === 'All' || m.category === activeCategory);

  return (
    <div className="h-full w-full bg-slate-100 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white pt-4 pb-2 shadow-sm z-10 sticky top-0 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-slate-800 text-center">Daily Smile Feed</h2>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mx-4">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'feed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Fresh Memes
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Saved ({savedIds.length})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar items-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-colors flex-shrink-0 ${activeCategory === cat
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {displayedMemes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>No memes found.</p>
            {activeTab === 'saved' && <button onClick={() => setActiveTab('feed')} className="text-indigo-500 mt-2 font-medium">Go explore</button>}
            {activeCategory !== 'All' && <button onClick={() => setActiveCategory('All')} className="text-indigo-500 mt-2 font-medium block w-full">Clear filter</button>}
          </div>
        ) : (
          displayedMemes.map((meme, idx) => (
            <React.Fragment key={meme.id}>
              <MemeCard
                meme={meme}
                isLiked={likedIds.includes(meme.id)}
                isSaved={savedIds.includes(meme.id)}
                onLike={() => toggleLike(meme.id)}
                onSave={() => toggleSave(meme.id)}
                onShare={() => handleShare(meme)}
                onDownload={() => handleDownload(meme)}
                onShowToast={(msg) => showToast(msg)}
              />

              {/* Dynamic Ad Injection */}
              {(idx + 1) % adFreq === 0 && (
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Sponsored</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">"This could be your ad."</p>
                  <button className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-full font-bold shadow-sm hover:scale-105 transition">Learn More</button>
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

const MemeCard: React.FC<{
  meme: Meme;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onDownload: () => void;
  onShowToast: (msg: string) => void;
}> = ({ meme, isLiked, isSaved, onLike, onSave, onShare, onDownload, onShowToast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this content?");
    if (!reason) return;

    onShowToast("Sending report...");

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: meme.id, contentUrl: meme.url, reason })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onShowToast("Report Sent Successfully!");
      } else {
        console.error("Report Error:", data);
        onShowToast("Failed to send report.");
      }
    } catch (e) {
      console.error("Report Network Error:", e);
      onShowToast("Error sending report.");
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}?meme=${meme.id}`;
    navigator.clipboard.writeText(shareUrl);
    onShowToast("🔗 Link Copied to Clipboard!");
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {/* Media Content */}
      <div className="relative aspect-square bg-black">
        {meme.type === 'image' ? (
          <img src={meme.url} alt={meme.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full relative cursor-pointer" onClick={togglePlay}>
            <video
              ref={videoRef}
              src={meme.url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
            />
            {/* Play/Pause Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <Play className="text-white fill-white" size={32} />
                </div>
              </div>
            )}
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 p-2 bg-black/50 rounded-full text-white backdrop-blur-md"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        )}
        {/* Category Tag Overlay */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <Tag size={10} />
          {meme.category}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex space-x-4">
            <button
              onClick={onLike}
              className={`transition-transform active:scale-75 ${isLiked ? 'text-red-500' : 'text-slate-800'}`}
            >
              <Heart size={26} className={isLiked ? 'fill-current' : ''} />
            </button>
            <button onClick={handleCopyLink} className="text-slate-800 hover:text-indigo-600 transition" title="Copy Link">
              <Share2 size={26} />
            </button>
            <button onClick={onDownload} className="text-slate-800 hover:text-indigo-600 transition">
              <Download size={26} />
            </button>
            <button onClick={handleReport} className="text-slate-400 hover:text-red-500 transition" title="Report">
              <Flag size={26} />
            </button>
          </div>
          <button
            onClick={onSave}
            className={`transition-colors ${isSaved ? 'text-indigo-600' : 'text-slate-800'}`}
          >
            <Bookmark size={26} className={isSaved ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Caption */}
        <div>
          {/* Caption */}
          <div className="mt-2">
            <p className="text-sm text-slate-900">
              <span className="font-bold mr-2">@bp_official</span>
              {meme.description ? (
                <span className="whitespace-pre-wrap">{meme.description}</span>
              ) : (
                <span className="italic text-slate-500">{meme.title}</span>
              )}
            </p>
            <p className="font-bold text-slate-500 text-[10px] mt-1 uppercase tracking-wider">{meme.likes + (isLiked ? 1 : 0)} likes</p>
          </div>
        </div>
      </div>
    </div>
  );
};
