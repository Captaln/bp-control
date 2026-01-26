import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, BUCKET_NAME } from "./r2.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password, key } = req.body;

    if (password !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        /* 
           Note: The 'key' must be the full path in R2, e.g., "memes/123-cat.png".
           But our frontend might send full URL "https://public.../memes/123-cat.png".
           We need to parse it if necessary, but ideally frontend sends the Key key.
        */

        // Strip domain if present
        let cleanKey = key;
        if (key.includes('/memes/')) {
            cleanKey = 'memes/' + key.split('/memes/')[1];
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: cleanKey,
        });

        await r2.send(command);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({ error: 'Failed to delete' });
    }
}
