import React from 'react';

interface StoryBubbleProps {
    stories: any[];
    onOpen: (index: number) => void;
}

export const StoryList: React.FC<StoryBubbleProps> = ({ stories, onOpen }) => {
    return (
        <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
            {/* Add 'New' Bubble */}
            <button onClick={() => onOpen(-1)} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                    <span className="text-xl">➕</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Add Story</span>
            </button>

            {stories.map((story, i) => (
                <button key={story.id} onClick={() => onOpen(i)} className="flex flex-col items-center gap-1 shrink-0 group">
                    <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600`}>
                        <div className={`w-full h-full rounded-full border-2 border-white dark:border-slate-900 ${story.background_style} flex items-center justify-center overflow-hidden`}>
                            <span className="text-[8px] text-white font-bold leading-tight px-1 text-center truncate max-w-full">
                                {story.content.slice(0, 15)}...
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary">
                        Anon
                    </span>
                </button>
            ))}
        </div>
    );
};
