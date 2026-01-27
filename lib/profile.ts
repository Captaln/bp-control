/**
 * User Profile Service
 * Handles username generation, storage, and retrieval
 */

import { supabase } from './supabase';
import { generateUsername } from './username';

export interface UserProfile {
    id: string;
    username: string;
    avatar_url?: string;
    is_creator: boolean;
    is_shadow_banned: boolean;
}

// Cache the profile in memory for the session
let cachedProfile: UserProfile | null = null;

export const getAnonymousId = () => {
    const key = 'bp_anon_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
};

/**
 * Get or create user profile
 * If user doesn't have a profile, creates one with auto-generated username
 */
/**
 * Get or create user profile
 * If user doesn't have a profile, creates one with auto-generated username
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
    // Return cached if available
    if (cachedProfile) return cachedProfile;

    try {
        // Get current user (Auth)
        let { data: { user } } = await supabase.auth.getUser();

        // If no user, Sign In Anonymously
        if (!user) {
            const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

            if (anonError || !anonData.user) {
                console.warn("Anon Auth Failed, switching to Guest Mode:", anonError);

                // FALLBACK: Generate Local ID and Register via API
                const fallbackId = getAnonymousId();
                const fallbackName = generateUsername();

                try {
                    await fetch('/api/guest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: fallbackId, username: fallbackName })
                    });
                } catch (e) {
                    console.error("Guest Registration failed", e);
                }

                return {
                    id: fallbackId,
                    username: fallbackName,
                    is_creator: false,
                    is_shadow_banned: false,
                } as UserProfile;
            }
            user = anonData.user;
        }

        const userId = user!.id; // asserted because we just signed in or had user

        // Try to get existing profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile && !error) {
            cachedProfile = profile;
            return profile;
        }

        // No profile exists - create one
        const newUsername = generateUsername();
        const newProfile: Partial<UserProfile> = {
            id: userId,
            username: newUsername,
            is_creator: false,
            is_shadow_banned: false,
        };

        const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

        if (createError) {
            console.error(' Supabase Create Failed, trying Guest API...:', createError);

            // FALLBACK: Call our own API to force-insert (Bypasses RLS)
            try {
                const apiRes = await fetch('/api/guest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProfile)
                });
                const apiData = await apiRes.json();

                if (apiData.success && apiData.profile) {
                    cachedProfile = apiData.profile;
                    return apiData.profile;
                }
            } catch (apiErr) {
                console.error("Guest API Failed", apiErr);
            }

            // If even that fails, return local obj (Admin won't see them, but App works)
            return {
                id: userId,
                username: newUsername,
                is_creator: false,
                is_shadow_banned: false,
            } as UserProfile;
        }

        cachedProfile = created;
        return created;
    } catch (err) {
        console.error('Profile fetch error:', err);
        return null;
    }
};

/**
 * Get username for display (with fallback for anonymous users)
 */
export const getDisplayUsername = async (): Promise<string> => {
    const profile = await getUserProfile();
    return profile ? profile.username : 'Guest';
};

/**
 * Clear cached profile (call on logout)
 */
export const clearProfileCache = () => {
    cachedProfile = null;
    // We do NOT clear the anon ID from localStorage, so they keep their identity if they log out
};

/**
 * Update username
 */
export const updateUsername = async (newUsername: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('profiles')
            .update({ username: newUsername, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (error) {
            console.error('Failed to update username:', error);
            return false;
        }

        // Update cache
        if (cachedProfile) {
            cachedProfile.username = newUsername;
        }

        return true;
    } catch (err) {
        console.error('Username update error:', err);
        return false;
    }
};
