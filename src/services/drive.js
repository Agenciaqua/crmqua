
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

export const driveService = {
    uploadFile: async (file, accessToken) => {
        const metadata = {
            name: file.name,
            mimeType: file.type,
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        try {
            const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Drive API Error Body:", errorBody);
                throw new Error(`Status: ${response.status} - ${errorBody}`);
            }

            const data = await response.json();
            return data; // Returns { id, name, mimeType }
        } catch (error) {
            console.error('Drive Upload Error:', error);
            throw error;
        }
    },

    getFile: async (fileId, accessToken) => {
        try {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch file from Drive');
            }

            return await response.blob();
        } catch (error) {
            console.error('Drive Fetch Error:', error);
            return null;
        }
    }
};
