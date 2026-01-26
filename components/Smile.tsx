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
        <div className="bg-black w-full h-full relative">

            {/* SCROLLABLE FEED */}
            <div
                className="w-full h-full overflow-y-auto scroll-smooth"
                style={{ scrollSnapType: 'y mandatory' }}
            >
                {loading && (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                    </div>
                )}

                {filteredItems.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-white/50 text-center p-8">
                        No memes in this category yet.
                    </div>
                )}

                {filteredItems.map((item) => (
                    <FeedCard
                        key={item.id}
                        item={item}
                        onShare={() => handleShare(item)}
                        onReport={() => setReportId(item.id)}
                    />
                ))}
            </div>

            {/* FLOATING HEADER */}
            <div className="absolute top-0 left-0 right-0 z-20 pt-3 px-4">
                {/* Top Gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" style={{ height: '120px', top: 0, left: 0, right: 0, position: 'fixed' }} />

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-white font-black tracking-tight text-lg drop-shadow-lg">DAILY SMILE</h1>
                        <button
                            onClick={() => fetchFeed(true)}
                            className="bg-black/30 backdrop-blur-md p-2 rounded-full active:bg-white/30 transition"
                        >
                            <RotateCcw className="text-white" size={16} />
                        </button>
                    </div>

                    {/* Glass Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition backdrop-blur-md ${activeCategory === cat
                                        ? 'bg-white/90 text-black shadow-lg'
                                        : 'bg-black/40 text-white/90 border border-white/20'
                                    }`}
                            >
                                {cat === 'all' ? '🔥 All' : `#${cat}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            <AnimatePresence>
                {reportId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
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

// Individual Feed Card with scroll snap
const FeedCard = ({ item, onShare, onReport }: { item: FeedItem, onShare: () => void, onReport: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.6 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="w-full relative"
            style={{
                height: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
            }}
        >
            {/* Media */}
            <div className="w-full h-full flex items-center justify-center bg-black">
                {item.type === 'video' ? (
                    <VideoPlayer src={item.url} isVisible={isVisible} />
                ) : (
                    <img src={item.url} alt="Meme" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Bottom Left Info */}
            <div className="absolute bottom-20 left-4 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white shadow-lg"></div>
                    <p className="text-white font-bold text-sm drop-shadow-lg">@bp_control</p>
                </div>
                <p className="text-white text-sm font-medium drop-shadow-lg">
                    {getTagDisplay(item.id)} <span className="text-white/60">#trending</span>
                </p>
            </div>

            {/* Right Action Buttons */}
            <div className="absolute bottom-20 right-4 z-10 flex flex-col items-center gap-5">
                <button onClick={onShare} className="flex flex-col items-center gap-1">
                    <div className="p-3 bg-black/30 backdrop-blur-md rounded-full active:scale-90 transition border border-white/10">
                        <Share2 size={24} className="text-white" />
                    </div>
                    <span className="text-white text-[10px] font-bold drop-shadow-lg">Share</span>
                </button>

                <button onClick={onReport} className="flex flex-col items-center gap-1">
                    <div className="p-3 bg-black/30 backdrop-blur-md rounded-full active:scale-90 transition border border-white/10">
                        <AlertTriangle size={22} className="text-white/80" />
                    </div>
                    <span className="text-white/80 text-[10px] font-bold drop-shadow-lg">Report</span>
                </button>
            </div>
        </div>
    );
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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm p-3 rounded-full pointer-events-none">
                    <p className="text-white text-[10px] font-bold tracking-widest uppercase">Tap for Sound</p>
                </div>
            )}
        </div>
    );
};

const getTagDisplay = (id: string) => {
    const parts = id.split('-');
    if (parts.length > 1 && isNaN(Number(parts[0]))) {
        return `#${parts[0]}`;
    }
    return '#viral';
};
