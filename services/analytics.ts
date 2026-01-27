/**
 * BP Control Analytics Service
 * Tracks user sessions and events for admin dashboard
 */

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

// Generate or retrieve persistent device ID
const getDeviceId = (): string => {
    const storageKey = 'bp_device_id';
    let deviceId = localStorage.getItem(storageKey);

    if (!deviceId) {
        // Generate a unique ID: timestamp + random
        deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(storageKey, deviceId);
    }

    return deviceId;
};

// Get current platform
const getPlatform = (): string => {
    if (Capacitor.isNativePlatform()) {
        return Capacitor.getPlatform(); // 'android' or 'ios'
    }
    return 'web';
};

// Current session ID (set when session starts)
let currentSessionId: string | null = null;
let sessionStartTime: number = Date.now();

/**
 * Start a new analytics session
 * Call this when app opens
 */
export const startSession = async (): Promise<string | null> => {
    try {
        const deviceId = getDeviceId();
        const platform = getPlatform();

        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('app_sessions')
            .insert({
                device_id: deviceId,
                user_id: user?.id || null,
                platform: platform,
                app_version: '1.0.0', // TODO: Get from config
            })
            .select('id')
            .single();

        if (error) {
            console.error('Analytics: Failed to start session', error);
            return null;
        }

        currentSessionId = data.id;
        sessionStartTime = Date.now();
        console.log('Analytics: Session started', currentSessionId);

        return currentSessionId;
    } catch (err) {
        console.error('Analytics: Session start error', err);
        return null;
    }
};

/**
 * End the current session
 * Call this when app closes/backgrounds
 */
export const endSession = async (): Promise<void> => {
    if (!currentSessionId) return;

    try {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

        await supabase
            .from('app_sessions')
            .update({
                ended_at: new Date().toISOString(),
                session_duration_seconds: durationSeconds,
            })
            .eq('id', currentSessionId);

        console.log('Analytics: Session ended', durationSeconds, 'seconds');
    } catch (err) {
        console.error('Analytics: Session end error', err);
    }
};

/**
 * Track an event
 * @param eventType - Type of event (game_start, game_end, bp_log, tab_view, etc.)
 * @param eventData - Additional data (game name, score, reading, etc.)
 */
export const trackEvent = async (
    eventType: string,
    eventData: Record<string, any> = {}
): Promise<void> => {
    try {
        const deviceId = getDeviceId();
        const { data: { user } } = await supabase.auth.getUser();

        await supabase
            .from('user_events')
            .insert({
                session_id: currentSessionId,
                device_id: deviceId,
                user_id: user?.id || null,
                event_type: eventType,
                event_data: eventData,
            });

        console.log('Analytics: Event tracked', eventType, eventData);
    } catch (err) {
        console.error('Analytics: Event tracking error', err);
    }
};

// ==========================================
// CONVENIENCE METHODS FOR SPECIFIC EVENTS
// ==========================================

/** Track when user views a tab */
export const trackTabView = (tabName: string) => {
    trackEvent('tab_view', { tab: tabName });
};

/** Track when user starts a game */
export const trackGameStart = (gameName: string) => {
    trackEvent('game_start', { game: gameName, started_at: Date.now() });
};

/** Track when user finishes a game */
export const trackGameEnd = (gameName: string, durationSeconds: number, completed: boolean) => {
    trackEvent('game_end', {
        game: gameName,
        duration_seconds: durationSeconds,
        completed
    });
};

/** Track when user logs BP */
export const trackBPLog = (systolic: number, diastolic: number) => {
    trackEvent('bp_log', { systolic, diastolic });
};

/** Track when user saves a meme */
export const trackMemeSave = (memeId: string) => {
    trackEvent('meme_save', { meme_id: memeId });
};

/** Track when user shares a meme */
export const trackMemeShare = (memeId: string) => {
    trackEvent('meme_share', { meme_id: memeId });
};
