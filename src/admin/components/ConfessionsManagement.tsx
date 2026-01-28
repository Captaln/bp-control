import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Trash2, StopCircle, RefreshCw, MessageSquare, Plus, Send } from 'lucide-react';

export const ConfessionsManagement = () => {
    const [confessions, setConfessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    // Create Mode
    const [isCreating, setIsCreating] = useState(false);
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState("post");

    useEffect(() => {
        fetchConfessions();

        // Realtime Subscription
        const channel = supabase
            .channel('confessions_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, () => {
                fetchConfessions();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const fetchConfessions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('confessions')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setConfessions(data);
        setLoading(false);
    };

    const [adminPassword, setAdminPassword] = useState(localStorage.getItem('bp_admin_pwd') || '');

    const getPassword = () => {
        if (adminPassword) return adminPassword;
        const pwd = prompt("Admin Password:");
        if (pwd) {
            setAdminPassword(pwd);
            localStorage.setItem('bp_admin_pwd', pwd);
        }
        return pwd;
    };

    const handleAction = async (id: string, updates: any) => {
        const password = getPassword();
        if (!password) return;

        const res = await fetch('/api/admin/confessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', id, updates, password })
        });
        const data = await res.json();
        if (data.error) {
            alert("Action Failed: " + data.error);
            if (data.error.includes("password")) {
                setAdminPassword('');
                localStorage.removeItem('bp_admin_pwd');
            }
        } else {
            fetchConfessions();
            setConfessions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Permanently delete?')) return;
        const password = getPassword();
        if (!password) return;

        const res = await fetch('/api/admin/confessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id, password })
        });
        const data = await res.json();
        if (data.error) {
            alert("Delete Failed: " + data.error);
            if (data.error.includes("password")) setAdminPassword('');
        } else {
            fetchConfessions();
            setConfessions(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleCreate = async () => {
        if (!newContent.trim()) return;
        const password = getPassword();
        if (!password) return;

        const res = await fetch('/api/admin/confessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                updates: {
                    content: newContent,
                    type: newType,
                    background_style: 'midnight'
                },
                password
            })
        });

        const data = await res.json();

        if (data.error) {
            alert("Error: " + data.error);
        } else {
            setNewContent("");
            setIsCreating(false);
            fetchConfessions();
        }
    };

    const filtered = confessions.filter(c => {
        if (filter === 'pending') return !c.is_approved;
        if (filter === 'approved') return c.is_approved;
        return true;
    });

    return (
        <div className="text-white">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md text-sm font-bold ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>All</button>
                    <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-md text-sm font-bold ${filter === 'pending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Pending</button>
                    <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-md text-sm font-bold ${filter === 'approved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Approved</button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsCreating(!isCreating)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition font-bold text-xs flex items-center gap-2 px-4">
                        <Plus size={16} /> New Confession
                    </button>
                    <button onClick={fetchConfessions} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"><RefreshCw size={18} /></button>
                </div>
            </div>

            {/* Creation UI */}
            {isCreating && (
                <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2">
                    <h3 className="font-bold mb-2 text-indigo-400">Write New Confession</h3>
                    <div className="flex gap-2 mb-2">
                        <button onClick={() => setNewType('post')} className={`flex-1 py-1 text-xs font-bold rounded ${newType === 'post' ? 'bg-indigo-600' : 'bg-slate-800'}`}>Post (Long)</button>
                        <button onClick={() => setNewType('story')} className={`flex-1 py-1 text-xs font-bold rounded ${newType === 'story' ? 'bg-purple-600' : 'bg-slate-800'}`}>Story (Short)</button>
                    </div>
                    <textarea
                        className="w-full bg-slate-950 p-3 rounded-lg text-sm mb-2 border border-slate-700 focus:border-indigo-500 outline-none"
                        rows={3}
                        placeholder="Spill the tea..."
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                        <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                            <Send size={14} /> Post Live
                        </button>
                    </div>
                </div>
            )}

            {loading && <div className="text-center text-slate-500 py-10">Loading tea...</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(item => (
                    <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col relative group hover:border-indigo-500/50 transition">
                        {/* Badge */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.type === 'story' ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                {item.type}
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.is_approved ? 'bg-green-900/50 text-green-400' : 'bg-orange-900/50 text-orange-400'}`}>
                                {item.is_approved ? 'LIVE' : 'HIDDEN'}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 mb-4 mt-6">
                            <p className="text-slate-200 text-sm whitespace-pre-wrap">{item.content}</p>
                        </div>

                        <p className="text-slate-600 text-[10px] font-mono mb-4">{new Date(item.created_at).toLocaleString()}</p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto pt-4 border-t border-slate-800">
                            {!item.is_approved ? (
                                <button
                                    onClick={() => handleAction(item.id, { is_approved: true })}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                                >
                                    <Check size={14} /> Approve
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleAction(item.id, { is_approved: false })}
                                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                                >
                                    <StopCircle size={14} /> Hide
                                </button>
                            )}
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="px-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg transition"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
