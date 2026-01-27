/**
 * Creator Upload Component
 * Only visible to users marked as creators by admin
 */

import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Check, X, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getUserProfile } from '../lib/profile';

const API_BASE_URL = Capacitor.isNativePlatform()
    ? "https://bp-control.vercel.app/api"
    : "/api";

const CATEGORIES = ['funny', 'dark', 'tech', 'animals', 'wholesome', 'shitpost', 'relatable', 'motivational'];

interface CreatorUploadProps {
    onClose?: () => void;
}

export const CreatorUpload: React.FC<CreatorUploadProps> = ({ onClose }) => {
    const [isCreator, setIsCreator] = useState<boolean | null>(null); // null = loading
    const [username, setUsername] = useState('');

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [category, setCategory] = useState('funny');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Check if user is a creator
    useEffect(() => {
        const checkCreator = async () => {
            const profile = await getUserProfile();
            if (profile) {
                setIsCreator(profile.is_creator);
                setUsername(profile.username);
            } else {
                setIsCreator(false);
            }
        };
        checkCreator();
    }, []);

    // Generate preview when file is selected
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview(null);
    }, [file]);

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            // 1. Get Presigned URL
            const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());

            const initRes = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    filetype: file.type,
                    category,
                    description // Pass to API
                })
            });

            const data = await initRes.json();
            if (!data.uploadUrl) {
                throw new Error(data.error || 'Failed to get upload URL');
            }

            // 2. Upload to R2
            await fetch(data.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            // Success!
            setSuccess(true);
            setFile(null);
            setPreview(null);

            // Reset after showing success
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // Loading state
    if (isCreator === null) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-950">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    // Not a creator
    if (!isCreator) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-center p-8">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                    <X className="text-red-500" size={40} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Not Authorized</h2>
                <p className="text-slate-400 mb-6 max-w-xs">
                    You need creator access to upload memes. Contact the admin with your username:
                </p>
                <div className="bg-slate-800 px-4 py-2 rounded-lg font-mono text-indigo-400 text-lg">
                    {username || 'Loading...'}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="mt-8 px-6 py-2 bg-slate-800 text-white rounded-xl"
                    >
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    // Creator view - show upload form
    return (
        <div className="h-full bg-slate-950 p-6 pb-24 overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white">Upload Meme</h1>
                <p className="text-slate-400 text-sm">Share your content with the community</p>
            </header>

            {success ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <Check className="text-green-500" size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Uploaded Successfully!</h2>
                    <p className="text-slate-400">Your meme is now live in the feed.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* File Picker */}
                    <div className="relative">
                        <input
                            type="file"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            accept="image/*,video/*"
                        />
                        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${file ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-900'}`}>
                            {preview ? (
                                <div className="relative">
                                    {file?.type.startsWith('video') ? (
                                        <video src={preview} className="max-h-64 mx-auto rounded-xl" controls />
                                    ) : (
                                        <img src={preview} className="max-h-64 mx-auto rounded-xl object-contain" />
                                    )}
                                    <p className="text-indigo-400 font-bold mt-4 text-sm truncate">{file?.name}</p>
                                </div>
                            ) : (
                                <div className="text-slate-500">
                                    <ImageIcon className="mx-auto mb-3 opacity-50" size={48} />
                                    <p className="font-bold">Tap to select image or video</p>
                                    <p className="text-xs mt-1 opacity-70">Max 50MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Category (Hashtag)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition ${category === cat
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    #{cat}
                                </button>
                            ))}
                        </div>
                        {/* Description Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Description / Caption
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a funny caption..."
                                className="w-full bg-slate-800 border-none rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            />
                        </div>

                        {/* Upload Button */}
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Publish to Feed
                                </>
                            )}
                        </button>

                        {/* Creator Badge */}
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Creator Mode Active • @{username}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
