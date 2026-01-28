import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const AgeGate = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkProfile = async (userId: string) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('dob')
                .eq('id', userId)
                .single();

            if (!profile?.dob) {
                setIsVisible(true);
            }
        };

        // Listen for Auth Changes (e.g. Anon Login success)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                checkProfile(session.user.id);
            }
        });

        // Initial Check (in case already logged in)
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) checkProfile(user.id);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!dob) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate if 18+
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs); // miliseconds from epoch
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        const is18 = age >= 18;

        const { error } = await supabase
            .from('profiles')
            .update({
                dob: dob,
                is_18_plus: is18
            })
            .eq('id', user.id);

        if (error) {
            alert("Error saving date of birth: " + error.message);
        } else {
            setIsVisible(false);
        }
        setLoading(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="w-full max-w-md text-center">
                <div className="text-6xl mb-6">🎂</div>
                <h2 className="text-2xl font-bold text-white mb-2">When is your birthday?</h2>
                <p className="text-slate-400 mb-8">We need your age to personalize your experience and ensure community safety. This won't be public.</p>

                <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xl p-4 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none mb-6 text-center"
                />

                <button
                    onClick={handleSave}
                    disabled={!dob || loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </div>
        </div>
    );
};
