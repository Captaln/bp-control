import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, LayoutDashboard, Users, Image, Bell, Settings, MessageSquare, Megaphone } from 'lucide-react';
import { UserManagement } from './components/UserManagement';
import { ContentManagement } from './components/ContentManagement';
import { NotificationCenter } from './components/NotificationCenter';
import { ConfessionsManagement } from './components/ConfessionsManagement';
import { AdsManagement } from './components/AdsManagement';

// TODO: User to provide actual admin email
const ADMIN_EMAILS = [
    'shivaram0663@gmail.com',
    'admin@bpcontrol.com'
];

export default function AdminApp() {
    const [session, setSession] = useState<any>(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('DASHBOARD');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkAdminAccess(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            checkAdminAccess(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdminAccess = async (session: any) => {
        setLoading(true);
        if (session?.user?.email) {
            if (ADMIN_EMAILS.includes(session.user.email)) {
                setSession(session);
                setAccessDenied(false);
            } else {
                // Not an authorized admin email
                await supabase.auth.signOut();
                setSession(null);
                setAccessDenied(true);
            }
        } else {
            // No session or no email, user is not logged in
            setSession(null);
            setAccessDenied(false); // Reset access denied if user logs out or session expires
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen bg-slate-950 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="flex h-screen w-screen bg-slate-950 text-white items-center justify-center p-4">
                <div className="text-center max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-red-900/50 shadow-2xl">
                    <Shield className="mx-auto h-16 w-16 text-red-500 mb-6" />
                    <h1 className="text-3xl font-bold mb-3 text-red-500">Access Denied</h1>
                    <p className="text-slate-400 mb-6">
                        Your account (<span className="text-white font-mono bg-slate-800 px-1 rounded">{session?.user?.email || 'Unknown'}</span>)
                        is not authorized to access the Command Center.
                    </p>
                    <button
                        onClick={() => setAccessDenied(false)}
                        className="w-full py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition font-bold text-white border border-slate-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!session) {
        return <AdminLogin />;
    }

    // Real layout starts here
    return (
        <div className="flex h-screen w-screen bg-slate-950 text-white font-sans overflow-hidden">
            <AdminSidebar currentView={currentView} onNavigate={setCurrentView} />

            <main className="flex-1 overflow-y-auto bg-slate-900/50 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white capitalize">{currentView.toLowerCase()}</h1>
                        <p className="text-slate-400 text-sm">Overview of your application status</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white">{session.user.email}</p>
                            <div className="flex items-center justify-end gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <p className="text-xs text-green-500 font-mono">ONLINE</p>
                            </div>
                        </div>
                    </div>
                </header>

                {currentView === 'DASHBOARD' && <DashboardStats />}
                {currentView === 'USERS' && <UserManagement />}
                {currentView === 'CONTENT' && <ContentManagement />}
                {currentView === 'NOTIFICATIONS' && <NotificationCenter />}
                {currentView === 'CONFESSIONS' && <ConfessionsManagement />}
                {currentView === 'ADS' && <AdsManagement />}
                {currentView === 'SETTINGS' && (
                    <div className="p-8 border border-red-900/30 rounded-2xl bg-red-900/10">
                        <h3 className="text-red-500 font-bold mb-4">Danger Zone</h3>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition font-bold text-white"
                        >
                            Logout System
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

// Sub-components
const AdminSidebar = ({ currentView, onNavigate }: { currentView: string, onNavigate: (v: string) => void }) => {
    const MENU = [
        { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Command Center' },
        { id: 'USERS', icon: Users, label: 'User Database' },
        { id: 'CONFESSIONS', icon: MessageSquare, label: 'Confessions' },
        { id: 'ADS', icon: Megaphone, label: 'Monetization' },
        { id: 'CONTENT', icon: Image, label: 'Content & CMS' },
        { id: 'NOTIFICATIONS', icon: Bell, label: 'Broadcasts' },
        { id: 'SETTINGS', icon: Settings, label: 'System Config' },
    ];

    return (
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col p-4">
            <div className="flex items-center gap-3 px-2 mb-10 mt-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Shield className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-lg tracking-tight">BP Admin</h2>
                    <p className="text-[10px] text-slate-500 font-mono">v2.0 GOD_MODE</p>
                </div>
            </div>

            <nav className="space-y-1 flex-1">
                {MENU.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`}
                    >
                        <item.icon size={20} />
                        <span className="text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

const DashboardStats = () => {
    const [stats, setStats] = useState<any>({
        totalUsers: 0,
        activeToday: 0,
        memeCount: 0,
        bpLogsTotal: 0,
        gamesPlayed: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();
                if (data) {
                    setStats(data);
                }
            } catch (e) {
                console.error("Stats fetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Live Telemetry...</div>;

    // Calculate total games played
    const totalGames = Object.values(stats.gamesPlayed || {}).reduce((a: number, b: any) => a + b, 0) as number;

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Users"
                    value={stats.totalUsers?.toLocaleString() || '0'}
                    trend="All Devices"
                    color="text-white"
                />
                <StatCard
                    label="Active Today"
                    value={stats.activeToday || 0}
                    trend="Sessions"
                    active
                />
                <StatCard
                    label="Meme Library"
                    value={stats.memeCount || 0}
                    trend="In R2"
                    color="text-indigo-400"
                />
                <StatCard
                    label="BP Logs"
                    value={stats.bpLogsTotal || 0}
                    trend="Total"
                    color="text-emerald-400"
                />
            </div>

            {/* Game Popularity */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    🎮 Game Popularity
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{totalGames} plays</span>
                </h3>

                {Object.keys(stats.gamesPlayed || {}).length === 0 ? (
                    <p className="text-slate-500 text-sm">No game data yet. Users need to play games.</p>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(stats.gamesPlayed || {})
                            .sort(([, a]: any, [, b]: any) => b - a)
                            .map(([game, count]: [string, any]) => {
                                const percentage = totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;
                                return (
                                    <div key={game} className="flex items-center gap-3">
                                        <span className="text-slate-400 text-sm w-24 capitalize">{game}</span>
                                        <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-white text-sm font-bold w-12 text-right">{count}</span>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Quick Info */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
                <p>📊 <strong className="text-white">Registered Users:</strong> {stats.registeredUsers || 0} (with account)</p>
                <p className="mt-1">💡 <strong className="text-white">Tip:</strong> Total Users counts all devices that opened the app, even without login.</p>
            </div>
        </div>
    );
}

const StatCard = ({ label, value, trend, active, color = 'text-white' }: any) => (
    <div className={`p-6 bg-slate-900 rounded-2xl border border-slate-800 ${active ? 'ring-1 ring-green-500/50' : ''}`}>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-end justify-between">
            <h3 className={`text-3xl font-black ${color}`}>{value}</h3>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{trend}</span>
        </div>
    </div>
);

function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                    emailRedirectTo: 'https://bp-control.vercel.app/admin',
                },
            });
            if (error) throw error;
            alert('Check your email for the Magic Link!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mb-4">
                        <Shield className="h-8 w-8 text-indigo-500" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Access</h2>
                    <p className="mt-2 text-sm text-slate-400">Restricted Area. Authorized Personnel Only.</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="relative block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="Password (Optional for Magic Link)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg border border-red-900/50">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Authenticating...' : 'Login with Password'}
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-800"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">Or</span>
                            <div className="flex-grow border-t border-slate-800"></div>
                        </div>

                        <button
                            type="button"
                            onClick={handleMagicLink}
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 focus:outline-none disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                            Send Magic Link 🪄
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
