import React, { useState } from 'react';
import { X, Mic, Send, Type, Sparkles } from 'lucide-react';

const GRADIENTS = [
    { id: 'default', css: 'bg-gradient-to-br from-indigo-500 to-purple-600', label: '💜 Default' },
    { id: 'fire', css: 'bg-gradient-to-br from-orange-400 to-red-600', label: '🔥 Fire' },
    { id: 'ocean', css: 'bg-gradient-to-br from-cyan-400 to-blue-600', label: '🌊 Ocean' },
    { id: 'midnight', css: 'bg-gradient-to-br from-slate-900 to-slate-800', label: '🌑 Midnight' },
    { id: 'toxic', css: 'bg-gradient-to-br from-lime-400 to-green-600', label: '🤢 Toxic' },
];

interface CreateModalProps {
    onClose: () => void;
    onPost: (data: any) => Promise<void>;
}

export const CreateConfessionModal: React.FC<CreateModalProps> = ({ onClose, onPost }) => {
    const [mode, setMode] = useState<'story' | 'post'>('story');
    const [content, setContent] = useState("");
    const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        // Rule: Auto-detect Short Stories
        if (mode === 'post' && content.length < 150) {
            const confirmSwitch = confirm("This is short enough to be a Story! 🎨\n\nWant to switch to Story mode to add a cool background?");
            if (confirmSwitch) {
                setMode('story');
                return; // Let user customize background
            }
        }

        setLoading(true);
        try {
            await onPost({
                content,
                type: mode,
                background_style: selectedGradient.css, // Send CSS class or ID, backend stores it
                allow_comments: true,
                allow_reactions: true
            });
            onClose();
        } catch (e: any) {
            alert(e.message || "Failed to post");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">Confess 🤫</h3>
                    <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-950">
                    <button
                        onClick={() => setMode('story')}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'story' ? 'bg-white dark:bg-slate-800 shadow text-primary' : 'text-slate-500'}`}
                    >
                        <Sparkles size={16} /> Story
                    </button>
                    <button
                        onClick={() => setMode('post')}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${mode === 'post' ? 'bg-white dark:bg-slate-800 shadow text-primary' : 'text-slate-500'}`}
                    >
                        <Type size={16} /> Post
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                    {mode === 'story' ? (
                        <div className={`aspect-[9/16] w-full rounded-2xl ${selectedGradient.css} p-6 flex items-center justify-center relative shadow-inner`}>
                            <textarea
                                className="bg-transparent w-full h-full text-center text-white text-2xl font-black placeholder-white/50 focus:outline-none resize-none flex items-center justify-center"
                                placeholder="Typing..."
                                value={content}
                                onChange={e => setContent(e.target.value.slice(0, 200))}
                                maxLength={280}
                            />
                            <span className="absolute bottom-4 right-4 text-xs text-white/60 font-mono">{content.length}/280</span>
                        </div>
                    ) : (
                        <textarea
                            className="w-full h-64 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none resize-none"
                            placeholder="Write your deep confession here..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    )}

                    {/* Gradient Selector (Story Only) */}
                    {mode === 'story' && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                            {GRADIENTS.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGradient(g)}
                                    className={`w-8 h-8 rounded-full ${g.css} ring-2 ring-offset-2 dark:ring-offset-slate-900 ${selectedGradient.id === g.id ? 'ring-primary' : 'ring-transparent'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50 transition"
                    >
                        {loading ? 'Posting...' : 'Post Anonymously'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Account age &gt; 3 days required. Be kind.
                    </p>
                </div>
            </div>
        </div>
    );
};
