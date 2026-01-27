import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, AlertTriangle, RotateCcw, Bookmark } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AnimatePresence } from 'framer-motion';

const API_BASE_URL = Capacitor.isNativePlatform()
    ? "https://bp-control.vercel.app/api"
    : "/api";

interface FeedItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    timestamp: string;
}

const CATEGORIES = ['all', 'funny', 'dark', 'tech', 'animals', 'wholesome', 'shitpost'];

const getCategory = (id: string): string => {
    const parts = id.split('-');
    if (parts.length > 1 && isNaN(Number(parts[0]))) {
        return parts[0].toLowerCase();
    }
    return 'uncategorized';
};

const getTagDisplay = (id: string) => {
    const cat = getCategory(id);
    return cat === 'uncategorized' ? '#viral' : `#${cat}`;
};

export const Smile = () => {
    const [allItems, setAllItems] = useState<FeedItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportId, setReportId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('all');
    // Bookmarks (Watch Later)
    const [bookmarks, setBookmarks] = useState<string[]>(() => {
        const saved = localStorage.getItem('bp_bookmarks');
        return saved ? JSON.parse(saved) : [];
    });
    const [viewMode, setViewMode] = useState<'feed' | 'saved'>('feed');

    const hasFetched = useRef(false);

    const fetchFeed = useCallback(async (force = false) => {
        if (hasFetched.current && !force) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/feed`);
            const data = await res.json();
            if (Array.isArray(data)) {
                // "Smart Shuffle"
                for (let i = data.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data[i], data[j]] = [data[j], data[i]];
                }
                setAllItems(data);
                if (viewMode === 'feed') {
                    if (activeCategory === 'all') setFilteredItems(data);
                    else setFilteredItems(data.filter((item: FeedItem) => getCategory(item.id) === activeCategory));
                }
                hasFetched.current = true;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, viewMode]);

    // Update filtered items when bookmarks/viewMode changes
    useEffect(() => {
        if (viewMode === 'saved') {
            const savedItems = allItems.filter(item => bookmarks.includes(item.id));
            setFilteredItems(savedItems);
        } else {
            if (activeCategory === 'all') setFilteredItems(allItems);
            else setFilteredItems(allItems.filter(item => getCategory(item.id) === activeCategory));
        }
    }, [viewMode, bookmarks, allItems, activeCategory]);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    const handleCategoryChange = (cat: string) => {
        setViewMode('feed');
        setActiveCategory(cat);
    };

    const toggleBookmark = (id: string) => {
        setBookmarks(prev => {
            const newBookmarks = prev.includes(id)
                ? prev.filter(b => b !== id)
                : [...prev, id];
            localStorage.setItem('bp_bookmarks', JSON.stringify(newBookmarks));
            return newBookmarks;
        });
        Toast.show({ text: bookmarks.includes(id) ? 'Removed from Watch Later' : 'Added to Watch Later' });
    };

    const handleShare = async (item: FeedItem) => {
        try {
            await Share.share({
                title: 'BP Control Meme',
                text: `Check this ${getTagDisplay(item.id)} meme!`,
                url: item.url,
                dialogTitle: 'Share',
            });
        } catch (err) { }
    };

    const handleReport = async (reason: string) => {
        if (!reportId) return;
        const item = allItems.find(i => i.id === reportId);
        if (!item) return;

        setReportId(null);
        await Toast.show({ text: 'Reported.' });

        try {
            await fetch(`${API_BASE_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, contentId: item.id, contentUrl: item.url })
            });
        } catch (err) { console.error(err); }
    };

    return (
        <div className="bg-slate-950 w-full h-full flex flex-col">

            {/* FIXED HEADER */}
            <div className="flex-shrink-0 bg-slate-950 border-b border-slate-800 pt-3 pb-2 px-4 z-10 transition-all">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-white font-bold text-lg flex items-center gap-2">
                        {viewMode === 'saved' ? 'Watch Later' : 'Daily Smile'}
                        {viewMode === 'saved' && <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded text-white">{filteredItems.length}</span>}
                    </h1>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(prev => prev === 'feed' ? 'saved' : 'feed')}
                            className={`p-2 rounded-full transition ${viewMode === 'saved' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                            <Bookmark size={20} fill={viewMode === 'saved' ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={() => fetchFeed(true)}
                            className="bg-slate-800 p-2 rounded-full active:bg-slate-700 transition lg:hover:bg-slate-700"
                        >
                            <RotateCcw className="text-white" size={16} />
                        </button>
                    </div>
                </div>

                {/* Category Tabs (Only show in Feed mode) */}
                {viewMode === 'feed' && (
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${activeCategory === cat
                                    ? 'bg-white text-black'
                                    : 'bg-slate-800 text-slate-300'
                                    }`}
                            >
                                {cat === 'all' ? '🔥 All' : `#${cat}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* SCROLLABLE FEED */}
            <div className="flex-1 overflow-y-auto pb-20">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    </div>
                )}

                {filteredItems.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center px-8">
                        {viewMode === 'saved' ? (
                            <>
                                <Bookmark size={48} className="mb-4 opacity-20" />
                                <p>No saved memes yet.</p>
                                <button onClick={() => setViewMode('feed')} className="mt-4 text-indigo-400 font-bold text-sm">Go to Feed</button>
                            </>
                        ) : (
                            <p>No memes in this category yet.</p>
                        )}
                    </div>
                )}

                {/* Feed Cards */}
                <div className="flex flex-col gap-4 p-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                            {/* Card Header */}
                            <div className="flex items-center gap-3 p-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500"></div>
                                <div className="flex-1">
                                    <p className="text-white font-bold text-sm">@bp_control</p>
                                    <p className="text-slate-500 text-xs">{getTagDisplay(item.id)}</p>
                                </div>
                            </div>

                            {/* Media - Full Width, No Cropping */}
                            <div className="w-full bg-black">
                                {item.type === 'video' ? (
                                    <VideoPlayer src={item.url} itemId={item.id} />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt="Meme"
                                        className="w-full h-auto object-contain max-h-[70vh]"
                                        loading="lazy"
                                    />
                                )}
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-4 p-3 border-t border-slate-800">
                                <button
                                    onClick={() => handleShare(item)}
                                    className="flex items-center gap-2 text-white hover:text-blue-400 transition"
                                >
                                    <Share2 size={20} />
                                    <span className="text-sm font-medium">Share</span>
                                </button>

                                <button
                                    onClick={() => toggleBookmark(item.id)}
                                    className={`flex items-center gap-2 transition ${bookmarks.includes(item.id) ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
                                >
                                    <Bookmark size={20} fill={bookmarks.includes(item.id) ? "currentColor" : "none"} />
                                    <span className="text-sm font-medium">{bookmarks.includes(item.id) ? 'Saved' : 'Save'}</span>
                                </button>

                                <button
                                    onClick={() => setReportId(item.id)}
                                    className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition ml-auto"
                                >
                                    <AlertTriangle size={18} />
                                    <span className="text-sm">Report</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Report Modal */}
            <AnimatePresence>
                {reportId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-700 shadow-2xl">
                            <h3 className="text-white font-bold text-lg mb-4 text-center">Report Content</h3>
                            <div className="grid gap-2">
                                {['Spam / Scam', 'Offensive', 'Not Funny', 'Other'].map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => handleReport(reason)}
                                        className="w-full p-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95 transition text-center"
                                    >
                                        {reason}
                                    </button>
                                ))}
                                <button onClick={() => setReportId(null)} className="mt-2 text-slate-400 font-medium py-2">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const VideoPlayer = ({ src, itemId }: { src: string, itemId: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    // Auto-play when visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (videoRef.current) {
                    if (entry.isIntersecting) {
                        videoRef.current.play().catch(() => { });
                        setIsPlaying(true);
                    } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                    }
                }
            },
            { threshold: 0.5 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full relative bg-black"
            onClick={() => setIsMuted(!isMuted)}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-auto object-contain max-h-[70vh]"
                loop
                muted={isMuted}
                playsInline
            />
            {isMuted && isPlaying && (
                <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded-md">
                    <p className="text-white text-[10px] font-bold">🔇 Tap for sound</p>
                </div>
            )}
        </div>
    );
};
