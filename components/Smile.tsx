import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';

// API CONSTANTS
const API_BASE_URL = Capacitor.isNativePlatform()
    ? "https://bp-control.vercel.app/api"
    : "/api";

interface FeedItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    timestamp: string;
}

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
        <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                src={src}
                className="w-full h-auto max-h-[85vh]"
                loop
                muted={isMuted}
                playsInline
                onClick={() => setIsMuted(!isMuted)}
            />
            {isMuted && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                        <p className="text-white text-xs font-bold">Tap to Unmute</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Smile = () => {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportId, setReportId] = useState<string | null>(null); // Id of item being reported

    // Cache logic: Keep feed in a ref so it survives tab switches
    const hasFetched = useRef(false);

    const fetchFeed = useCallback(async (force = false) => {
        if (hasFetched.current && !force) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/feed`);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Smart Shuffle (Fisher-Yates)
                for (let i = data.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data[i], data[j]] = [data[j], data[i]];
                }
                setItems(data);
                hasFetched.current = true;
            }
        } catch (error) {
            console.error("Feed Error", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const handleShare = async (item: FeedItem) => {
        try {
            await Share.share({
                title: 'Check this out on BP Control!',
                text: 'Found this joke regarding BP!',
                url: item.url,
                dialogTitle: 'Share with friends',
            });
        } catch (err) {
            console.error("Share failed", err);
        }
    };

    const handleReport = async (reason: string) => {
        if (!reportId) return;
        const item = items.find(i => i.id === reportId);
        if (!item) return;

        try {
            await fetch(`${API_BASE_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason,
                    contentId: item.id,
                    contentUrl: item.url
                })
            });
            await Toast.show({ text: 'Report submitted. We will review it.' });
            setReportId(null);
        } catch (err) {
            await Toast.show({ text: 'Could not send report' });
        }
    };

    return (
        <div className="bg-black min-h-full pb-20 relative">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10">
                <h2 className="text-xl font-bold text-white tracking-tight">Daily Smile</h2>
                <button onClick={() => fetchFeed(true)} className="p-2 bg-white/10 rounded-full text-white active:bg-white/20">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Feed */}
            <div className="flex flex-col gap-8 pb-32">
                {items.map((item, index) => (
                    <FeedCard
                        key={item.id}
                        item={item}
                        onShare={() => handleShare(item)}
                        onReport={() => setReportId(item.id)}
                    />
                ))}
            </div>

            {loading && (
                <div className="text-white text-center py-10">Loading memes...</div>
            )}

            {/* Report Modal */}
            <AnimatePresence>
                {reportId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 w-full max-w-sm rounded-2xl p-5 border border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">Report Content</h3>
                                <button onClick={() => setReportId(null)} className="text-slate-400"><X size={24} /></button>
                            </div>
                            <div className="grid gap-3">
                                {['Inappropriate', 'Spam', 'Not Funny', 'Other'].map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => handleReport(reason)}
                                        className="w-full p-3 rounded-lg bg-slate-800 text-slate-200 font-medium hover:bg-slate-700 text-left"
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Extracted Card for Intersection Observer Logic (Auto-Pause)
const FeedCard = ({ item, onShare, onReport }: { item: FeedItem, onShare: () => void, onReport: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.6 } // 60% visible to play
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="w-full bg-black border-b border-white/5 pb-4">
            {/* Media */}
            <div className="w-full relative min-h-[300px] flex items-center justify-center bg-black">
                {item.type === 'video' ? (
                    <VideoPlayer src={item.url} isVisible={isVisible} />
                ) : (
                    <img
                        src={item.url}
                        alt="Meme"
                        loading="lazy"
                        className="w-full h-auto object-contain max-h-[85vh]"
                    />
                )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex gap-4">
                    <button onClick={onShare} className="flex flex-col items-center gap-1 text-white/90 active:scale-95 transition">
                        <Share2 size={24} />
                        <span className="text-[10px] font-medium">Share</span>
                    </button>
                </div>
                <button onClick={onReport} className="text-slate-600 hover:text-red-500 transition">
                    <AlertTriangle size={20} />
                </button>
            </div>
        </div>
    );
};
