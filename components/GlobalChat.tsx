import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
    id: number;
    created_at: string;
    username: string;
    message: string;
}

// Generate random username
const generateUsername = () => {
    const adjectives = ['Happy', 'Angry', 'Chill', 'Wild', 'Sleepy', 'Hyper', 'Calm', 'Crazy'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Wolf', 'Bear', 'Fox', 'Owl', 'Lion'];
    const num = Math.floor(Math.random() * 999);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${num}`;
};

export const GlobalChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [username] = useState(() => {
        // Get or create username in localStorage
        const saved = localStorage.getItem('bp_chat_username');
        if (saved) return saved;
        const newName = generateUsername();
        localStorage.setItem('bp_chat_username', newName);
        return newName;
    });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [cooldown, setCooldown] = useState(0);


    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch initial messages
    useEffect(() => {
        fetchMessages();

        // Subscribe to realtime updates
        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                }
            )
            .subscribe();



        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || cooldown > 0 || sending) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert([{ username, message: newMessage.trim() }]);

            if (error) throw error;

            setNewMessage('');
            setCooldown(30); // 30 second cooldown
            inputRef.current?.blur();
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message. Try again.');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full w-full flex flex-col bg-slate-950">
            {/* Header */}
            <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-white font-bold text-lg">Global Vent Room</h1>
                        <p className="text-slate-400 text-xs">Anonymous chat • Be respectful</p>
                    </div>
                    <button
                        onClick={fetchMessages}
                        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition"
                    >
                        <RefreshCw size={18} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-center">
                        <div>
                            <p className="text-4xl mb-2">😶</p>
                            <p>No messages yet.</p>
                            <p className="text-sm">Be the first to vent!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.username === username
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-slate-800 text-white rounded-bl-sm'
                                }`}>
                                <p className="text-[10px] font-bold opacity-70 mb-1">
                                    {msg.username === username ? 'You' : msg.username}
                                </p>
                                <p className="text-sm break-words">{msg.message}</p>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-1 px-2">
                                {formatTime(msg.created_at)}
                            </p>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 p-4 mb-16">
                <div className="flex gap-2 items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value.slice(0, 200))}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : "What's on your mind?"}
                        disabled={cooldown > 0 || sending}
                        className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-500 disabled:opacity-50 outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={200}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={cooldown > 0 || sending || !newMessage.trim()}
                        className="p-3 bg-blue-600 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-500 active:scale-95 transition"
                    >
                        {cooldown > 0 ? (
                            <span className="text-sm font-bold w-6 inline-block text-center">{cooldown}</span>
                        ) : sending ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">
                    You're <span className="text-blue-400 font-bold">{username}</span> • {newMessage.length}/200 chars
                </p>
            </div>
        </div>
    );
};
