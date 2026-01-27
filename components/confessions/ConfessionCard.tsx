import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface ConfessionCardProps {
    item: any;
    onReact: (id: string, emoji: string) => void;
    onComment: (id: string) => void;
    currentUserId?: string;
}

export const ConfessionCard: React.FC<ConfessionCardProps> = ({ item, onReact, onComment }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-4 transition">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        ?
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Anonymous</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <button className="text-slate-400">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {item.content}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-700 pt-3">
                <button
                    onClick={() => onReact(item.id, '❤️')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 transition group"
                >
                    <Heart size={18} className="group-hover:fill-red-500" />
                    <span className="text-xs font-bold group-hover:text-red-500">
                        {item.reactions?.[0]?.count || 0}
                    </span>
                </button>

                <button
                    onClick={() => onComment(item.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition"
                >
                    <MessageCircle size={18} />
                    <span className="text-xs font-bold">
                        {item.comments?.[0]?.count || 0}
                    </span>
                </button>

                <button className="flex items-center gap-1.5 text-slate-400 hover:text-green-500 transition ml-auto">
                    <Share2 size={18} />
                </button>
            </div>
        </div>
    );
};
