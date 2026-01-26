import React, { useState, useEffect } from 'react';
import { Heart, Share2, Bookmark, Download, Play, Pause, Volume2, VolumeX, Tag } from 'lucide-react';
import { Meme } from '../types';

// Mock Data Service (In a real app, this comes from your Admin Backend)
const MOCK_MEMES: Meme[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=800&q=80',
    title: 'When the code works on the first try',
    likes: 1240,
    category: 'Tech Life'
  },
  {
    id: '2',
    type: 'video',
    // Using a reliable placeholder video
    url: 'https://assets.mixkit.co/videos/preview/mixkit-driving-in-city-traffic-at-night-4155-large.mp4',
    title: 'Trying to stay calm in traffic like...',
    likes: 856,
    category: 'Relatable'
  },
  {
    id: '3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80',
    title: 'My dog judging my life choices',
    likes: 3421,
    category: 'Animal Antics'
  },
  {
    id: '4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80',
    title: 'Monday mornings be like',
    likes: 950,
    category: 'Work Humor'
  },
  {
    id: '5',
    type: 'video',
    // Using a reliable placeholder video
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-wild-cat-resting-on-the-grass-4235-large.mp4',
    title: 'If I fits, I sits (Stress relief edition)',
    likes: 5100,
    category: 'Animal Antics'
  }
];

const CATEGORIES = ['All', 'Work Humor', 'Animal Antics', 'Relatable', 'Tech Life'];

export const Laugh: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'saved'>('feed');
  const [activeCategory, setActiveCategory] = useState('All');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [memes, setMemes] = useState<Meme[]>(MOCK_MEMES);

  // Load interactions from local storage
  useEffect(() => {
    const savedLiked = localStorage.getItem('bp_liked_memes');
    const savedSaved = localStorage.getItem('bp_saved_memes');
    if (savedLiked) setLikedIds(JSON.parse(savedLiked));
    if (savedSaved) setSavedIds(JSON.parse(savedSaved));
  }, []);

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BP Control Meme',
          text: meme.title,
          url: meme.url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      alert('Share feature not supported on this browser, but URL copied!');
      navigator.clipboard.writeText(meme.url);
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
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-colors flex-shrink-0 ${
                        activeCategory === cat
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
          displayedMemes.map(meme => (
            <MemeCard 
              key={meme.id} 
              meme={meme} 
              isLiked={likedIds.includes(meme.id)}
              isSaved={savedIds.includes(meme.id)}
              onLike={() => toggleLike(meme.id)}
              onSave={() => toggleSave(meme.id)}
              onShare={() => handleShare(meme)}
              onDownload={() => handleDownload(meme)}
            />
          ))
        )}
      </div>
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
}> = ({ meme, isLiked, isSaved, onLike, onSave, onShare, onDownload }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

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
            <button onClick={onShare} className="text-slate-800 hover:text-indigo-600 transition">
              <Share2 size={26} />
            </button>
            <button onClick={onDownload} className="text-slate-800 hover:text-indigo-600 transition">
              <Download size={26} />
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
          <p className="font-bold text-slate-800 text-sm mb-1">{meme.likes + (isLiked ? 1 : 0)} likes</p>
          <p className="text-slate-700">
            <span className="font-bold mr-2">Admin</span>
            {meme.title}
          </p>
        </div>
      </div>
    </div>
  );
};
