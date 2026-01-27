import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Megaphone, Save, AlertTriangle } from 'lucide-react';

export const AdsManagement = () => {
    const [config, setConfig] = useState<any>({});
    const [jsonStr, setJsonStr] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('admin_config')
            .select('*')
            .in('key', ['ad_feed_frequency', 'ad_story_frequency', 'ad_banner_enabled', 'ad_banner_content']);

        if (data) {
            const configObj: any = {};
            data.forEach((item: any) => configObj[item.key] = item.value);
            setConfig(configObj);
            setJsonStr(configObj.ad_banner_content || '{"title": "Default", "text": "Ad"}');
        }
        setLoading(false);
    };

    const handleSave = async (key: string, value: string) => {
        await supabase.from('admin_config').upsert({ key, value });
        setConfig(prev => ({ ...prev, [key]: value }));
        // Provide visual feedback?
    };

    return (
        <div className="max-w-2xl mx-auto text-white">
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-indigo-500/30 p-8 rounded-2xl mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
                    <Megaphone className="text-indigo-400" />
                    Monetization Control
                </h2>
                <p className="text-slate-400">Manage ad injection frequency and native banner content globally.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">Injection Frequency</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase mb-2">Feed (Every X Posts)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white flex-1 focus:border-indigo-500 focus:outline-none"
                                defaultValue={config.ad_feed_frequency || '10'}
                                onBlur={(e) => handleSave('ad_feed_frequency', e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">Lower = more ads.</p>
                    </div>

                    <div>
                        <label className="block text-slate-500 text-xs font-bold uppercase mb-2">Stories (Every X Slides)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white flex-1 focus:border-indigo-500 focus:outline-none"
                                defaultValue={config.ad_story_frequency || '5'}
                                onBlur={(e) => handleSave('ad_story_frequency', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex justify-between">
                    Native Banner Configuration
                    <button
                        onClick={() => handleSave('ad_banner_content', jsonStr)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                    >
                        <Save size={14} /> Save JSON
                    </button>
                </h3>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <textarea
                        className="w-full h-48 bg-transparent p-4 text-sm font-mono text-emerald-400 focus:outline-none"
                        value={jsonStr}
                        onChange={(e) => setJsonStr(e.target.value)}
                    />
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-yellow-500 bg-yellow-900/10 p-2 rounded">
                    <AlertTriangle size={12} />
                    <span>Warning: Invalid JSON will break the ad display. Validate before saving.</span>
                </div>
            </div>
        </div>
    );
};
