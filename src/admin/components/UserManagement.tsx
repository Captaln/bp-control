/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Shield, ShieldAlert, Ghost, UserCheck, Trash2 } from 'lucide-react';

const API_Base = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api'; // Adjust for local dev proxy if needed

export const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_Base}/admin/users`);
            const data = await res.json();
            if (data.users) setUsers(data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: string, payload?: any) => {
        if (!confirm('Are you sure you want to perform this action?')) return;

        try {
            await fetch(`${API_Base}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, userId, payload })
            });
            fetchUsers(); // Refresh
        } catch (err) {
            alert('Action failed');
        }
    };

    // Filter users
    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.id.includes(search)
    );

    return (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-slate-800 pl-10 pr-4 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 md:w-96"
                    />
                </div>
                <div className="text-slate-400 text-sm font-mono">
                    {filteredUsers.length} Users Found
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-12">Loading Grid...</td></tr>
                        ) : filteredUsers.map(user => {
                            const isShadowBanned = user.user_metadata?.is_shadow_banned;
                            const isCreator = user.user_metadata?.is_creator;

                            return (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                {user.email?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white max-w-[150px] truncate" title={user.email}>{user.email}</div>
                                                <div className="text-xs font-mono text-slate-500">{user.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {isCreator ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20">
                                                <Shield size={12} /> Creator
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-xs">User</span>
                                        )}
                                        {user.user_metadata?.is_trusted && (
                                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                                Trusted
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        {isShadowBanned ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                                                <Ghost size={12} /> Shadow Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                                <UserCheck size={12} /> Active
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Creator Toggle */}
                                            <button
                                                title={isCreator ? "Remove Creator" : "Make Creator"}
                                                onClick={() => handleAction(user.id, 'UPDATE_METADATA', { ...user.user_metadata, is_creator: !isCreator })}
                                                className={`p-2 rounded-lg transition ${isCreator ? 'bg-yellow-500 text-black' : 'bg-slate-800 hover:text-yellow-400'}`}
                                            >
                                                <Shield size={16} />
                                            </button>

                                            {/* Shadow Ban Toggle */}
                                            <button
                                                title={isShadowBanned ? "Lift Ban" : "Shadow Ban"}
                                                onClick={() => handleAction(user.id, 'UPDATE_METADATA', { ...user.user_metadata, is_shadow_banned: !isShadowBanned })}
                                                className={`p-2 rounded-lg transition ${isShadowBanned ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:text-purple-400'}`}
                                            >
                                                <Ghost size={16} />
                                            </button>

                                            {/* Trust Toggle */}
                                            <button
                                                title={user.user_metadata?.is_trusted ? "Untrust User" : "Trust User"}
                                                onClick={() => handleAction(user.id, 'UPDATE_METADATA', { ...user.user_metadata, is_trusted: !user.user_metadata?.is_trusted })}
                                                className={`p-2 rounded-lg transition ${user.user_metadata?.is_trusted ? 'bg-green-600 text-white' : 'bg-slate-800 hover:text-green-400'}`}
                                            >
                                                <ShieldAlert size={16} />
                                            </button>

                                            {/* Nuke Button */}
                                            <button
                                                title="Permanently Delete"
                                                onClick={() => handleAction(user.id, 'BAN')}
                                                className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 hover:text-white transition text-slate-400"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Footer */}
            <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
                End of list.
            </div>
        </div>
    );
};
