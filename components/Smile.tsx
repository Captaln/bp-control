import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
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

    const hasFetched = useRef(false);

    const fetchFeed = useCallback(async (force = false) => {
        if (hasFetched.current && !force) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/feed`);
            const data = await res.json();
            if (Array.isArray(data)) {
                for (let i = data.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data[i], data[j]] = [data[j], data[i]];
                }
                setAllItems(data);
                setFilteredItems(data);
                hasFetched.current = true;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        if (cat === 'all') {
            setFilteredItems(allItems);
        } else {
            setFilteredItems(allItems.filter(item => getCategory(item.id) === cat));
        }
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
        try {
            await fetch(`${API_BASE_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, contentId: item.id, contentUrl: item.url })
            });
            await Toast.show({ text: 'Reported.' });
            setReportId(null);
        } catch (err) { }
    };

    return (
        <div className="bg-slate-950 w-full h-full flex flex-col">

            {/* FIXED HEADER */}
            <div className="flex-shrink-0 bg-slate-950 border-b border-slate-800 pt-3 pb-2 px-4 z-10">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-white font-bold text-lg">Daily Smile</h1>
                    <button
                        onClick={() => fetchFeed(true)}
                        className="bg-slate-800 p-2 rounded-full active:bg-slate-700 transition"
                    >
                        <RotateCcw className="text-white" size={16} />
                    </button>
                </div>

                {/* Category Tabs */}
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
            </div>

            {/* SCROLLABLE FEED - Instagram Style */}
            <div className="flex-1 overflow-y-auto pb-20">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    </div>
                )}

                {filteredItems.length === 0 && !loading && (
                    <div className="flex items-center justify-center py-20 text-slate-500 text-center px-8">
                        No memes in this category yet.
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
