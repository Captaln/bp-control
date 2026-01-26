import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, AlertTriangle, RotateCcw, X } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = Capacitor.isNativePlatform()
    ? "https://bp-control.vercel.app/api"
    : "/api";

interface FeedItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    timestamp: string;
}

// Categories for filter tabs
const CATEGORIES = ['all', 'funny', 'dark', 'tech', 'animals', 'wholesome', 'shitpost'];

// Helper to extract category from filename
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

const VideoPlayer = ({ src, isVisible }: { src: string, isVisible: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (videoRef.current) {
            if (isVisible) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative" onClick={() => setIsMuted(!isMuted)}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
            />
            {isMuted && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full backdrop-blur pointer-events-none">
                    <p className="text-white text-[10px] font-bold tracking-widest uppercase">Tap to Sound</p>
                </div>
            )}
        </div>
    );
};

export const Smile = () => {
    const [allItems, setAllItems] = useState<FeedItem[]>([]); // Original list
    const [filteredItems, setFilteredItems] = useState<FeedItem[]>([]); // Displayed list
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
                // Fisher-Yates Shuffle
                for (let i = data.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data[i], data[j]] = [data[j], data[i]];
                }
                setAllItems(data);
                setFilteredItems(data); // Initially show all
                hasFetched.current = true;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    // Filter logic
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
        <div className="bg-black w-full h-screen flex flex-col overflow-hidden">

            {/* Fixed Header with Tabs */}
            <div className="flex-shrink-0 bg-black/90 backdrop-blur-md z-20 pt-4 pb-2 px-4 border-b border-white/10">
                <div className="flex justify-between items-center mb-3">
                    <h1 className="text-white font-black tracking-tighter text-xl">DAILY SMILE</h1>
                    <button
                        onClick={() => fetchFeed(true)}
                        className="bg-white/10 p-2 rounded-full active:bg-white/30 transition"
                    >
                        <RotateCcw className="text-white" size={18} />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${activeCategory === cat
                                    ? 'bg-white text-black'
                                    : 'bg-white/10 text-white/70'
                                }`}
                        >
                            {cat === 'all' ? '🔥 All' : `#${cat}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed Items - Snap Scroll */}
            <div className="flex-1 overflow-y-scroll snap-y snap-mandatory">
                {filteredItems.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-white/50 text-center p-8">
                        No memes in this category yet.
                    </div>
                )}
                {filteredItems.map((item) => (
                    <div key={item.id} className="w-full h-full snap-start snap-always relative flex-shrink-0" style={{ minHeight: 'calc(100vh - 100px)' }}>
                        <FeedCard item={item} />

                        {/* Overlay: Bottom Left Info (Tags) */}
                        <div className="absolute bottom-20 left-4 z-10 w-3/4 pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white"></div>
                                <p className="text-white font-bold text-sm drop-shadow-md">@bp_control</p>
                            </div>
                            <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md">
                                {getTagDisplay(item.id)} <span className="text-white/60 font-normal">#trending</span>
                            </p>
                        </div>

                        {/* Overlay: Right Action Buttons */}
                        <div className="absolute bottom-20 right-4 z-10 flex flex-col items-center gap-5">
                            <button onClick={() => handleShare(item)} className="flex flex-col items-center gap-1">
                                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-90 transition">
                                    <Share2 size={24} className="text-white" />
                                </div>
                                <span className="text-white text-[10px] font-bold">Share</span>
                            </button>

                            <button onClick={() => setReportId(item.id)} className="flex flex-col items-center gap-1">
                                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-90 transition">
                                    <AlertTriangle size={22} className="text-white/80" />
                                </div>
                                <span className="text-white/80 text-[10px] font-bold">Report</span>
                            </button>
                        </div>

                        {/* Gradient Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </div>
                ))}
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent opacity-50"></div>
                </div>
            )}

            {/* Report Modal */}
            <AnimatePresence>
                {reportId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                            <h3 className="text-white font-bold text-xl mb-4 text-center">Report Content</h3>
                            <div className="grid gap-3">
                                {['Spam / Scam', 'Offensive', 'Not Funny', 'Other'].map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => handleReport(reason)}
                                        className="w-full p-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95 transition text-center"
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

const FeedCard = ({ item }: { item: FeedItem }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.6 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="w-full h-full flex items-center justify-center bg-black">
            {item.type === 'video' ? (
                <VideoPlayer src={item.url} isVisible={isVisible} />
            ) : (
                <img src={item.url} alt="Meme" className="w-full h-full object-cover" />
            )}
        </div>
    );
};
