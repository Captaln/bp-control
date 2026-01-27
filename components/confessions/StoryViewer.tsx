import React, { useState, useEffect } from 'react';
import { X, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryViewerProps {
    stories: any[];
    initialIndex: number;
    onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ stories, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-advance
    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + 1; // 5 seconds total (100 * 50ms)
            });
        }, 50);
        return () => clearInterval(interval);
    }, [currentIndex, isPaused]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const story = stories[currentIndex];

    // Ad Injection for Demo (Every 5th) - Logic could be here

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Progress Bars */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                {stories.map((_, i) => (
                    <div key={i} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                        <div
                            className={`h-full bg-white transition-all duration-100 ease-linear ${i === currentIndex ? '' : (i < currentIndex ? 'w-full' : 'w-0')}`}
                            style={{ width: i === currentIndex ? `${progress}%` : undefined }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-20 text-white">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xs">?</div>
                    <div>
                        <p className="text-sm font-bold shadow-black drop-shadow-md">Anonymous</p>
                        <p className="text-[10px] opacity-80 shadow-black drop-shadow-md">Just now</p>
                    </div>
                </div>
                <button onClick={onClose}><X size={24} className="drop-shadow-md" /></button>
            </div>

            {/* Content Main */}
            <div
                className={`flex-1 ${story.background_style} flex items-center justify-center p-8 relative`}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
            >
                {/* IDK if gradients are passed as class names like 'bg-gradient...', if so fine. */}
                <h2 className="text-3xl font-black text-white text-center drop-shadow-lg leading-tight">
                    {story.content}
                </h2>

                {/* Tap Zones */}
                <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
                <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
            </div>

            {/* Reactions Footer */}
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-4">
                {/* Floating emojis could go here */}
                <button className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition">🔥</button>
                <button className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition">😂</button>
                <button className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition">💀</button>
                <button className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/40 transition">❤️</button>
            </div>
        </div>
    );
};
