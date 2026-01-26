import React, { useState } from 'react';
import { Upload, X, Trash2, Lock, Tag } from 'lucide-react';
import { AppView } from '../types';

// Password for simple auth
const ADMIN_PASS = "admin123";
const API_BASE_URL = "https://bp-control.vercel.app/api";

interface AdminProps {
    onNavigate: (view: AppView) => void;
}

const CATEGORIES = [
    { id: 'funny', label: '😂 Funny' },
    { id: 'dark', label: '💀 Dark Humor' },
    { id: 'tech', label: '💻 Tech/Coding' },
    { id: 'animals', label: '🐱 Animals' },
    { id: 'wholesome', label: '💖 Wholesome' },
    { id: 'shitpost', label: '💩 Shitpost' }
];

export const AdminDashboard: React.FC<AdminProps> = ({ onNavigate }) => {
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");
    const [existingFiles, setExistingFiles] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("funny");

    const handleLogin = () => {
        if (password === ADMIN_PASS) {
            setIsAuthenticated(true);
            fetchFiles();
        } else {
            alert("Wrong Password");
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/feed`);
            const data = await res.json();
            setExistingFiles(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm("Delete this meme?")) return;
        try {
            await fetch(`${API_BASE_URL}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: ADMIN_PASS, key })
            });
            setExistingFiles(prev => prev.filter(f => !f.url.includes(key)));
        } catch (e) {
            alert("Failed to delete");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setUploading(true);
        setUploadStatus("Getting secure link...");

        try {
            // 1. Get Presigned URL
            const presignRes = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: ADMIN_PASS,
                    filename: file.name,
                    filetype: file.type,
                    category: selectedCategory
                })
            });

            if (!presignRes.ok) throw new Error("Auth Failed");
            const { uploadUrl } = await presignRes.json();

            // 2. Upload to R2
            setUploadStatus("Uploading to cloud...");
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT', // R2 requires PUT for presigned
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadRes.ok) throw new Error("Upload Failed");

            setUploadStatus("Success! 🎉");
            setTimeout(() => {
                setUploadStatus("");
                fetchFiles(); // Refresh list
            }, 2000);

        } catch (error: any) {
            setUploadStatus(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-900 text-white">
                <Lock size={48} className="mb-4 text-slate-400" />
                <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
                <input
                    type="password"
                    placeholder="Enter Password"
                    className="w-full max-w-xs p-4 rounded-xl bg-slate-800 border border-slate-700 text-center text-xl mb-4"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button
                    onClick={handleLogin}
                    className="w-full max-w-xs bg-primary p-4 rounded-xl font-bold hover:bg-primary-dark"
                >
                    Unlock
                </button>
                <button onClick={() => onNavigate(AppView.DASHBOARD)} className="mt-8 text-slate-500">Cancel</button>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-slate-800 shadow-sm flex justify-between items-center z-10 w-full">
                <h2 className="font-bold text-lg dark:text-white">Memes Manager</h2>
                <button onClick={() => onNavigate(AppView.DASHBOARD)}>
                    <X size={24} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 w-full">
                {/* Upload Zone */}
                <div className="mb-8 w-full">
                    {/* Category Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Category:</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`p-2 rounded-lg text-sm font-medium border transition ${selectedCategory === cat.id
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-800 transition relative">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        {uploading ? (
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-2"></div>
                        ) : (
                            <Upload size={40} className="text-primary mb-4" />
                        )}
                        <p className="font-bold text-slate-700 dark:text-slate-300">
                            {uploading ? "Uploading..." : `Upload to '${selectedCategory}'`}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Max 50MB</p>
                        {uploadStatus && <p className="mt-4 text-green-500 font-bold">{uploadStatus}</p>}
                    </div>
                </div>

                {/* Gallery */}
                <h3 className="font-bold text-slate-500 mb-4">Existing Content ({existingFiles.length})</h3>
                <div className="grid grid-cols-2 gap-4 w-full">
                    {existingFiles.map((file) => (
                        <div key={file.id || file.url} className="relative aspect-square rounded-xl overflow-hidden group bg-black">
                            {file.type === 'video' ? (
                                <video src={file.url} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <img src={file.url} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                                <span className="text-[10px] text-white font-mono truncate block text-center">
                                    {/* Try to parse category from filename if possible, else show ID */}
                                    {file.id.split('-')[0]}
                                </span>
                            </div>
                            <button
                                onClick={() => handleDelete(file.url)}
                                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition shadow-md"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
