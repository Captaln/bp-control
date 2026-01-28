import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export const Terms: React.FC<Props> = ({ onBack }) => {
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 relative">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <ArrowLeft size={24} className="text-slate-800 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Legal & Terms</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-slate-600 dark:text-slate-300 text-sm">
                <section>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">1. Terms of Use</h2>
                    <p>By using BP Control, you agree to treat all community members with respect. Harassment, hate speech, and illegal content are strictly prohibited.</p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">2. Age Requirement</h2>
                    <p>You must be at least 13 years old to use this app. Content marked as 18+ is restricted to users who have verified their age.</p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">3. User Content</h2>
                    <p>You retain ownership of content you post, but grant BP Control a license to display it. We reserve the right to remove any content that violates our policies.</p>
                </section>

                <section>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">4. Privacy Policy</h2>
                    <p>We collect minimal data to provide the service. We do not sell your personal data. Anonymous posts are truly anonymous to the public.</p>
                </section>

                <p className="text-xs text-slate-400 mt-8">Last Updated: January 2026</p>
            </div>
        </div>
    );
};
