
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
                const errorText = await response.text();

                if (response.status === 401) {
                    throw new Error("TokenExpired");
                }

                let errorMessage = `Status: ${response.status}`;

                try {
                    const errorObj = JSON.parse(errorText);
                    if (errorObj.error && errorObj.error.message) {
                        const msg = errorObj.error.message;
                        if (msg.includes('enable it by visiting') || msg.includes('API has not been used')) {
                            errorMessage = "A API do Google Drive não está ativada no seu Projeto Google Cloud. Por favor, ative-a: console.developers.google.com/apis/api/drive.googleapis.com";
                        } else {
                            errorMessage = msg;
                        }
                    }
                } catch (e) {
                    // Fallback check on raw text
                    if (errorText.includes('enable it by visiting') || errorText.includes('API has not been used')) {
                        errorMessage = "A API do Google Drive não está ativada no seu Projeto Google Cloud. Por favor, ative-a: console.developers.google.com/apis/api/drive.googleapis.com";
                    } else {
                        errorMessage += ` - ${errorText}`;
                    }
                }

                console.error("Drive API Error:", errorText);
                throw new Error(errorMessage);
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
                if (response.status === 401) {
                    throw new Error("TokenExpired");
                }
                throw new Error('Failed to fetch file from Drive');
            }

            return await response.blob();
        } catch (error) {
            console.error('Drive Fetch Error:', error);
            return null;
        }
    }
};
