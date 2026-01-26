import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, AlertTriangle, RotateCcw, X, Hash } from 'lucide-react';
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

// Helper to extract #tag from the ID string (which is filename)
const getTag = (id: string) => {
    // Expected format: category-timestamp-name.ext
    const parts = id.split('-');
    // Check if first part is a category (text) or timestamp (number)
    // If it is NOT a number, it is a category.
    if (parts.length > 1 && isNaN(Number(parts[0]))) {
        return `#${parts[0]}`;
    }
    return '#viral'; // Fallback for old files
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
                className="w-full h-full object-cover" // Full screen cover
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
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportId, setReportId] = useState<string | null>(null);

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
                setItems(data);
                hasFetched.current = true;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    const handleShare = async (item: FeedItem) => {
        try {
            await Share.share({
                title: 'BP Control Meme',
                text: `Check this ${getTag(item.id)} meme!`,
                url: item.url,
                dialogTitle: 'Share',
            });
        } catch (err) { }
    };

    const handleReport = async (reason: string) => {
        if (!reportId) return;
        const item = items.find(i => i.id === reportId);
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
        <div className="bg-black w-full h-full relative overflow-y-scroll snap-y snap-mandatory scroll-smooth">

            {/* Top Bar */}
            <div className="fixed top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
                <h1 className="text-white font-black tracking-tighter text-2xl drop-shadow-md">DAILY SMILE</h1>
                <button
                    onClick={() => fetchFeed(true)}
                    className="bg-white/10 backdrop-blur-md p-2 rounded-full pointer-events-auto active:bg-white/30 transition shadow-lg"
                >
                    <RotateCcw className="text-white" size={20} />
                </button>
            </div>

            {/* Feed Items */}
            {items.map((item) => (
                <div key={item.id} className="w-full h-full snap-start relative">
                    <FeedCard item={item} />

                    {/* Overlay: Bottom Left Info (Tags) */}
                    <div className="absolute bottom-24 left-4 z-10 w-3/4 pointer-events-none">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 border-2 border-white"></div>
                            <p className="text-white font-bold text-sm drop-shadow-md">@bp_control_official</p>
                        </div>
                        <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md">
                            {getTag(item.id)} <span className="text-white/60 font-normal">#trending #daily</span>
                        </p>
                    </div>

                    {/* Overlay: Right Action Buttons */}
                    <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-6">
                        <button
                            onClick={() => handleShare(item)}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-90 transition group-hover:bg-white/20">
                                <Share2 size={28} className="text-white" />
                            </div>
                            <span className="text-white text-[10px] font-bold drop-shadow-md">Share</span>
                        </button>

                        <button
                            onClick={() => setReportId(item.id)}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-full active:scale-90 transition group-hover:bg-white/20">
                                <AlertTriangle size={24} className="text-white/80 group-hover:text-red-400" />
                            </div>
                            <span className="text-white/80 text-[10px] font-bold drop-shadow-md">Report</span>
                        </button>
                    </div>
                </div>
            ))}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent opacity-50"></div>
                </div>
            )}

            {/* Report Modal */}
            <AnimatePresence>
                {reportId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8 backdrop-blur-sm">
                        <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                            <h3 className="text-white font-bold text-xl mb-4 text-center">Block Content?</h3>
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
            {/* Linear Gradient for overlay readability */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
    );
};
