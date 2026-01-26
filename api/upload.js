import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET_NAME } from "./r2.js";

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Basic "Admin" check (very simple password for this MVP)
    // In production, use real Auth (NextAuth, Firebase Auth, etc.)
    const { password, filename, filetype, category = 'uncategorized' } = req.body;

    // Hardcoded simple password for the user to use
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Save category in filename: memes/funny-timestamp-filename.jpg
        const key = `memes/${category}-${Date.now()}-${filename}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: filetype,
        });

        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

        return res.status(200).json({ uploadUrl, key });
    } catch (error) {
        console.error("Presign Error:", error);
        return res.status(500).json({ error: 'Failed to generate upload link' });
    }
}
