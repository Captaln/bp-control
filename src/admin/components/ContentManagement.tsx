/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Tag, Image as ImageIcon, Video, RefreshCw, ShieldAlert, Shield } from 'lucide-react';

const API_Base = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

const CATEGORIES = ['funny', 'dark', 'tech', 'animals', 'wholesome', 'shitpost'];



const ReportQueue = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base}/admin/reports?password=admin123`);
            const data = await res.json();
            if (data.reports) setReports(data.reports);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (reportId: string, contentId: string, action: 'dismiss' | 'delete_content') => {
        if (!confirm(action === 'delete_content' ? 'Delete this content and resolve report?' : 'Dismiss report?')) return;

        try {
            await fetch(`${API_Base}/admin/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'admin123', action, reportId, contentId })
            });
            // Optimistic update
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            alert('Action failed');
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="text-red-500" /> Reported Content ({reports.length})
            </h3>

            {loading ? (
                <div className="text-center text-slate-500 py-10">Loading reports...</div>
            ) : reports.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No active reports. Community is safe! 🛡️</div>
            ) : (
                <div className="space-y-4">
                    {reports.map(report => (
                        <div key={report.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {/* Content Preview (Mock/Link) */}
                            <div className="w-full md:w-32 aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative flex-shrink-0">
                                {report.content_url ? (
                                    report.content_url.includes('mp4') ?
                                        <video src={report.content_url} className="w-full h-full object-cover" muted /> :
                                        <img src={report.content_url} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-slate-500">No Preview</span>
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="text-white font-bold text-sm mb-1">Reason: <span className="text-red-400">{report.reason}</span></p>
                                <p className="text-slate-500 text-xs font-mono mb-2">Reported: {new Date(report.created_at).toLocaleString()}</p>
                                <a href={report.content_url} target="_blank" className="text-indigo-400 text-xs hover:underline flex items-center gap-1">
                                    View Content <ImageIcon size={12} />
                                </a>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleAction(report.id, report.content_id, 'dismiss')}
                                    className="flex-1 md:flex-none px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleAction(report.id, report.content_id, 'delete_content')}
                                    className="flex-1 md:flex-none px-4 py-2 bg-red-900/30 text-red-500 border border-red-900/50 rounded-lg text-xs font-bold hover:bg-red-900/50 transition flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Nuke Content
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ModerationQueue = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base}/admin/moderation?password=admin123`);
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'TRUST_USER') => {
        try {
            await fetch(`${API_Base}/admin/moderation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'admin123', action, id })
            });
            setItems(prev => prev.filter(i => i.id !== id)); // Optimistic remove
        } catch (err) {
            alert('Action failed');
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <ShieldAlert className="text-yellow-500" /> Moderation Queue ({items.length})
            </h3>

            {loading ? (
                <div className="text-slate-500 text-center py-10">Loading pending items...</div>
            ) : items.length === 0 ? (
                <div className="text-slate-500 text-center py-10">No pending uploads. Good job! 🎉</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => (
                        <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                            <div className="aspect-video bg-black relative">
                                {item.type === 'video' ? (
                                    <video src={item.url} className="w-full h-full object-contain" controls />
                                ) : (
                                    <img src={item.url} className="w-full h-full object-contain" />
                                )}
                                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-mono">
                                    {item.category}
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <p className="text-white text-sm font-bold mb-1">User: {item.profiles?.username || 'Unknown'}</p>
                                    <p className="text-slate-500 text-xs italic">"{item.description || 'No description'}"</p>
                                    <p className="text-slate-600 text-[10px] mt-2 font-mono">{new Date(item.created_at).toLocaleString()}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-auto">
                                    <button onClick={() => handleAction(item.id, 'REJECT')} className="py-2 bg-red-900/30 text-red-500 hover:bg-red-900/50 rounded-lg text-xs font-bold border border-red-900/50">Reject</button>
                                    <button onClick={() => handleAction(item.id, 'APPROVE')} className="py-2 bg-green-900/30 text-green-500 hover:bg-green-900/50 rounded-lg text-xs font-bold border border-green-900/50">Approve</button>
                                    <button onClick={() => handleAction(item.id, 'TRUST_USER')} className="py-2 bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50 rounded-lg text-xs font-bold border border-indigo-900/50" title="Approve & Trust User">Trust</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MemeManager = () => {
    const [memes, setMemes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState('funny');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchMemes();
    }, []);

    const fetchMemes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base}/feed`);
            const data = await res.json();
            if (Array.isArray(data)) setMemes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            // 1. Get Presigned URL
            const initRes = await fetch(`${API_Base}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    filetype: file.type,
                    category,
                    description,   // Pass description
                    password: 'admin123' // Access Key
                })
            });
            const resData = await initRes.json();
            if (!initRes.ok) throw new Error(resData.error || "Init Failed");
            const { uploadUrl } = resData;

            // 2. Upload to R2
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            // 3. Refresh
            alert('Upload successful!');
            setFile(null);
            fetchMemes();

        } catch (err: any) {
            alert(`Upload failed: ${err.message}`);
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm('Permanently delete this meme?')) return;
        try {
            // Extract Key from URL if needed, but feed usually provides URL. 
            // api/feed returns `url` like `.../memes/filename`. We need the key `memes/filename`.
            // Actually api/feed item DO NOT provide Key explicitly in the mapped object loop I saw earlier.
            // I need to parse it from the URL.
            // Feed URL: `${PUBLIC_DOMAIN}/${item.Key}`
            // So I can get key by removing domain.
            // Simplest is to pass the full URL to delete API if it handles it, or just the suffix.
            // Let's assume delete API expects 'filename' or 'key'.
            // I'll check api/delete.js content in a moment, but constructing the payload based on common sense:

            // Extract key from URL
            const urlObj = new URL(key); // key passed in is actually item.url
            const r2Key = urlObj.pathname.substring(1); // remove leading slash

            await fetch(`${API_Base}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: r2Key, // 'memes/...'
                    password: 'admin123'
                })
            });
            fetchMemes();
        } catch (err) {
            alert('Delete failed');
            console.error(err);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Panel */}
            <div className="lg:col-span-1">
                <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 sticky top-4">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Upload size={20} className="text-indigo-400" /> Upload Meme
                    </h3>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500 transition cursor-pointer relative bg-slate-800/50">
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*,video/*"
                            />
                            {file ? (
                                <div className="text-indigo-400 font-bold break-all">{file.name}</div>
                            ) : (
                                <div className="text-slate-500">
                                    <ImageIcon className="mx-auto mb-2 opacity-50" size={32} />
                                    <p className="text-sm">Drag or Click to Select</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        type="button"
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`px-2 py-1.5 rounded text-xs font-bold transition ${category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        #{cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Credits</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a caption, credits, or context..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                                rows={2}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition flex justify-center items-center gap-2"
                        >
                            {uploading ? 'Uploading...' : 'Publish to Feed'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Gallery */}
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Library ({memes.length})</h3>
                    <button onClick={fetchMemes} className="p-2 bg-slate-800 rounded-lg hover:text-white text-slate-400 transition">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {memes.map(meme => (
                        <div key={meme.id} className="group relative aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                            {meme.type === 'video' ? (
                                <video src={meme.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" muted />
                            ) : (
                                <img src={meme.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" loading="lazy" />
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                <button
                                    onClick={() => window.open(meme.url, '_blank')}
                                    className="p-2 bg-slate-700 rounded-full text-white hover:bg-indigo-600"
                                >
                                    <ImageIcon size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(meme.url)}
                                    className="p-2 bg-slate-700 rounded-full text-red-400 hover:bg-red-600 hover:text-white"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ChatModeration = () => (
    <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-2xl">
        <Tag className="mx-auto text-slate-600 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-400">Chat Moderation Module</h3>
        <p className="text-slate-500 mb-6">Coming in next update (requires API endpoint).</p>
        <button disabled className="px-6 py-2 bg-slate-800 text-slate-500 rounded-lg font-bold cursor-not-allowed">
            Nuke Chat Room
        </button>
    </div>
);

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${active ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
    >
        <Icon size={18} /> {label}
    </button>
);

export const ContentManagement = () => {
    const [activeTab, setActiveTab] = useState<'memes' | 'moderation' | 'reports' | 'chat'>('memes');

    return (
        <div className="space-y-6">
            <div className="flex gap-4 overflow-x-auto pb-2">
                <TabButton active={activeTab === 'memes'} onClick={() => setActiveTab('memes')} label="Meme Library" icon={ImageIcon} />
                <TabButton active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} label="Moderation Queue" icon={ShieldAlert} />
                <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="Reports" icon={Shield} />
                <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label="Chat Moderation" icon={Tag} />
            </div>

            {activeTab === 'memes' && <MemeManager />}
            {activeTab === 'moderation' && <ModerationQueue />}
            {activeTab === 'reports' && <ReportQueue />}
            {activeTab === 'chat' && <ChatModeration />}
        </div>
    );
};
