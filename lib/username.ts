/**
 * Username Generation Utility
 * Creates fun, anonymous usernames for new users
 */

// Adjectives - calm, positive vibes matching app theme
const ADJECTIVES = [
    'Calm', 'Zen', 'Chill', 'Happy', 'Peaceful', 'Serene', 'Gentle',
    'Bright', 'Cozy', 'Mellow', 'Tranquil', 'Blissful', 'Soothing',
    'Dreamy', 'Quiet', 'Soft', 'Warm', 'Cool', 'Fresh', 'Sweet',
    'Kind', 'Lucky', 'Brave', 'Wise', 'Swift', 'Bold', 'Jolly'
];

// Nouns - cute animals and nature
const NOUNS = [
    'Panda', 'Otter', 'Bunny', 'Fox', 'Koala', 'Sloth', 'Owl',
    'Penguin', 'Dolphin', 'Turtle', 'Deer', 'Bear', 'Wolf', 'Cat',
    'Cloud', 'Star', 'Moon', 'Wave', 'Breeze', 'Rain', 'Leaf',
    'River', 'Mountain', 'Sunrise', 'Sunset', 'Ocean', 'Forest'
];

/**
 * Generate a random username like "CalmPanda_4823"
 */
export const generateUsername = (): string => {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number

    return `${adjective}${noun}_${number}`;
};

/**
 * Check if username already exists (for uniqueness)
 * Note: In practice, collisions are extremely rare with 4-digit suffix
 */
export const isUsernameTaken = async (username: string): Promise<boolean> => {
    // Import supabase dynamically to avoid circular deps
    const { supabase } = await import('@/lib/supabase');

    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    return !error && !!data;
};

/**
 * Generate a unique username (retry if taken)
 */
export const generateUniqueUsername = async (): Promise<string> => {
    let username = generateUsername();
    let attempts = 0;

    while (attempts < 5) {
        const taken = await isUsernameTaken(username);
        if (!taken) return username;

        username = generateUsername();
        attempts++;
    }

    // Fallback: add more random digits
    return `${generateUsername()}${Math.floor(Math.random() * 100)}`;
};
