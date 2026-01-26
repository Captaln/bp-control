import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2, BUCKET_NAME, PUBLIC_DOMAIN } from "./r2.js";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: 'memes/', // We will store files in a 'memes' folder
        });

        const data = await r2.send(command);

        // Transform R2 data into Feed items
        const feed = (data.Contents || [])
            .filter(item => item.Size > 0) // Filter out folders
            .map(item => {
                const isVideo = item.Key.endsWith('.mp4') || item.Key.endsWith('.mov');
                return {
                    id: item.ETag.replace(/"/g, ''), // Use ETag as ID
                    url: `${PUBLIC_DOMAIN}/${item.Key}`,
                    type: isVideo ? 'video' : 'image',
                    timestamp: item.LastModified,
                    likes: Math.floor(Math.random() * 500) + 50 // Fake likes for now (or store in DB later)
                };
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Newest first

        return res.status(200).json(feed);
    } catch (error) {
        console.error("R2 List Error:", error);
        return res.status(500).json({ error: 'Failed to fetch feed', details: error.message });
    }
}
