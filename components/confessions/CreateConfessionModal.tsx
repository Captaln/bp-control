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
    const [isNSFW, setIsNSFW] = useState(false); // New State
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
                background_style: selectedGradient.css,
                is_nsfw: isNSFW, // Send Flag
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="font-bold text-white text-lg">Confess</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Mode Switcher */}
                <div className="flex p-2 bg-slate-950/50">
                    <button
                        onClick={() => setMode('story')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'story' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Story (Visual)
                    </button>
                    <button
                        onClick={() => setMode('post')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'post' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Post (Text)
                    </button>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className={`w-full min-h-[300px] rounded-2xl relative overflow-hidden transition-all duration-500 ${mode === 'story' ? selectedGradient.css : 'bg-slate-800'}`}>
                        <textarea
                            className={`w-full h-full p-6 bg-transparent border-none outline-none resize-none text-center flex items-center justify-center placeholder-white/50 ${mode === 'story' ? 'text-2xl font-bold text-white shadow-black drop-shadow-md' : 'text-base text-slate-200'}`}
                            placeholder={mode === 'story' ? "What's on your mind?" : "Tell your long story here..."}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            maxLength={mode === 'story' ? 280 : 5000}
                        />

                        {/* Character Count */}
                        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-white/60 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            {content.length} / {mode === 'story' ? 280 : 5000}
                        </div>
                    </div>

                    {/* Story Backgrounds */}
                    {mode === 'story' && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {GRADIENTS.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGradient(g)}
                                    className={`w-12 h-12 rounded-full flex-shrink-0 border-2 transition-all ${selectedGradient.id === g.id ? 'border-white scale-110' : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'} ${g.css}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* NSFW Toggle */}
                    <div className="mt-4 flex items-center gap-3 bg-red-900/10 border border-red-900/20 p-3 rounded-xl">
                        <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="nsfw-toggle" checked={isNSFW} onChange={e => setIsNSFW(e.target.checked)} className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-1 checked:bg-red-500 checked:translate-x-5 transition-transform duration-200" />
                            <label htmlFor="nsfw-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer border ${isNSFW ? 'bg-red-900 border-red-700' : 'bg-slate-800 border-slate-700'}`}></label>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="nsfw-toggle" className="text-white text-sm font-bold cursor-pointer block">Contains 18+ Content</label>
                            <p className="text-slate-400 text-xs">Mark this if your confession is for adults only.</p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/95">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                        {loading ? "Posting..." : "Post Anonymously"}
                    </button>
                    <p className="text-center text-slate-500 text-[10px] mt-2">
                        By posting, you agree to our <span className="underline">Terms</span>.
                        {mode === 'story' ? "Stories are auto-approved." : "Posts may be reviewed."}
                    </p>
                </div>
            </div>
        </div>
    );
};
