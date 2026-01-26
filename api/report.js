import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, BUCKET_NAME } from "./r2.js";

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { reason, contentId, contentUrl } = req.body;

        if (!reason || !contentId) {
            return res.status(400).json({ error: 'Missing details' });
        }

        const reportData = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            contentId,
            contentUrl,
            reason,
            status: 'pending' // pending review
        };

        const key = `reports/${reportData.timestamp}-${contentId}.json`;

        await r2.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(reportData, null, 2),
            ContentType: 'application/json'
        }));

        return res.status(200).json({ success: true, message: 'Report submitted' });
    } catch (error) {
        console.error("Report Error:", error);
        return res.status(500).json({ error: 'Failed to submit report' });
    }
}
