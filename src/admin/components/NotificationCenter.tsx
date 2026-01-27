/// <reference types="vite/client" />
import React, { useState } from 'react';
import { Send, Bell, Smartphone, Clock } from 'lucide-react';

const API_Base = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export const NotificationCenter = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await fetch(`${API_Base}/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, password: 'admin123' })
            });
            alert('Broadcast Sent!');
            setTitle('');
            setBody('');
        } catch (err) {
            alert('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Composer */}
                <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Send className="text-indigo-500" /> New Broadcast
                    </h3>

                    <form onSubmit={handleSend} className="space-y-6">
                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Good Morning! ☀️"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm font-bold mb-2">Message</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Don't forget to smile today..."
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white text-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
                        >
                            {sending ? 'Sending...' : 'Send to All Users'}
                        </button>
                    </form>
                </div>

                {/* Preview / History */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                        <h4 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-4">Live Preview</h4>

                        {/* Fake Android Notification */}
                        <div className="bg-slate-800/50 rounded-xl p-4 flex gap-4 items-start border border-slate-700/50">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                <Bell className="text-white" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <p className="text-xs font-bold text-slate-400">BP Control • Now</p>
                                </div>
                                <p className="font-bold text-white text-sm truncate">{title || 'Notification Title'}</p>
                                <p className="text-slate-300 text-sm line-clamp-2">{body || 'Your message will appear here...'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50">
                        <h4 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-4">Quick Templates</h4>
                        <div className="space-y-2">
                            {[
                                { t: 'Hydration Check 💧', b: 'Have you drank water recently? Stay hydrated!' },
                                { t: 'Vibe Check ✨', b: 'How are you feeling right now? Log your mood.' },
                                { t: 'New Feature 🚀', b: 'Check out the new Smile feed now updated!' },
                            ].map((template, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => { setTitle(template.t); setBody(template.b); }}
                                    className="w-full text-left p-3 hover:bg-slate-800 rounded-xl transition flex items-center gap-3 group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-slate-400">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-bold">{template.t}</p>
                                        <p className="text-slate-500 text-xs truncate">{template.b}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
