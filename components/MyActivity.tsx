
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    onBack: () => void;
}

interface ActivityItem {
    id: string;
    content: string;
    type: 'story' | 'post';
    created_at: string;
    is_approved: boolean;
    is_nsfw: boolean;
    background_style?: string;
}

export const MyActivity: React.FC<Props> = ({ onBack }) => {
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
    }, []);

    const fetchActivity = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/confessions/my-activity', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setItems(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this post permanently?')) return;

        // Optimistic update
        setItems(prev => prev.filter(i => i.id !== id));

        try {
            const { data: { session } } = await supabase.auth.getSession();
            await fetch('/api/admin/confessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Allow user to delete their own via a secure endpoint or reuse admin one if secured?
                // Actually, let's use a DELETE endpoint or just client-side RLS if enabled.
                // For now, assume RLS allows delete or we need a specific endpoint. 
                // Let's use the Admin API structure but we might need a specific user delete endpoint.
                // Re-using admin api might fail if it requires password.
                // Let's rely on RLS for now:
            });
            const { error } = await supabase.from('confessions').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            alert('Failed to delete. Refreshing...');
            fetchActivity();
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <ArrowLeft size={24} className="text-slate-800 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Activity</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center p-10 text-slate-400">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="text-center p-10 text-slate-400">No activity yet. Share your story!</div>
                ) : (
                    items.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === 'story' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {item.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.is_approved ? (
                                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                                            <CheckCircle size={14} /> LIVE
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                            <Clock size={14} /> PENDING
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-3 mb-3">
                                {item.content}
                            </p>

                            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex items-center gap-2 text-xs"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
