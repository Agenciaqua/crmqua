
import { stream } from '@netlify/functions';

export const handler = async (req, context) => {
    const { id, token } = req.queryStringParameters;

    if (!id || !token) {
        return {
            statusCode: 400,
            body: "Missing id or token"
        };
    }

    try {
        // 1. Get File Metadata for Name and MimeType
        const metadataReq = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=name,mimeType,size`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!metadataReq.ok) {
            throw new Error(`Metadata Fetch Failed: ${metadataReq.status}`);
        }

        const metadata = await metadataReq.json();

        // 2. Fetch File Content (Stream)
        const fileReq = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!fileReq.ok) {
            throw new Error(`File Fetch Failed: ${fileReq.status}`);
        }

        // 3. Return as Stream
        // We need to convert the web standard Fetch stream to a Node-compatible style if possible,
        // OR standard Netlify Functions (non-edge) usually expect a body.
        // HOWEVER, for large files, buffering to base64 (standard AWS Lambda body) might OOM.
        // We will try standard body buffer for now as it's safer for PDF/Images < 6MB.
        // For larger files, we might need Redirect, but user wants "System Storage" feel.

        const buffer = await fileReq.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return {
            statusCode: 200,
            headers: {
                "Content-Type": metadata.mimeType,
                "Content-Disposition": `attachment; filename="${metadata.name}"`,
                "Content-Length": metadata.size
            },
            body: base64,
            isBase64Encoded: true
        };

    } catch (error) {
        console.error("Proxy Error:", error);
        return {
            statusCode: 500,
            body: `Proxy Error: ${error.message}`
        };
    }
};
