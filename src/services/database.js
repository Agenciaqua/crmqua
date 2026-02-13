const API_URL = '/.netlify/functions/db';

// Schema definitions to prevent "Column does not exist" errors
const SCHEMAS = {
    clients: [
        'name', 'contact', 'email', 'phone', 'status', 'category',
        'lastInteraction', 'instagram', 'ownerId', 'role', 'relationship',
        'businessType', 'hasTraffic', 'website', 'prospectingDay', 'notes', 'source'
    ],
    tasks: [
        'title', 'assigneeId', 'status', 'priority', 'dueDate',
        'description', 'type', 'ownerId'
    ],
    users: [
        'name', 'email', 'password', 'role', 'avatar'
    ],
    meetings: [
        'title', 'clientId', 'date', 'time', 'duration', 'type',
        'notes', 'status', 'ownerId'
    ],
    files: [
        'name', 'type', 'size', 'date', 'ownerId', 'recipientId',
        'category', 'notes', 'storageKey'
    ]
};

const sanitize = (table, data) => {
    if (!SCHEMAS[table]) return data; // No schema, pass through (dangerous but flexible)

    const validData = {};
    SCHEMAS[table].forEach(field => {
        if (data[field] !== undefined) {
            // Special handling for hasTraffic (Client schema says TEXT, frontend might send boolean)
            if (field === 'hasTraffic' && typeof data[field] === 'boolean') {
                validData[field] = data[field] ? 'Sim' : 'Não';
            } else {
                validData[field] = data[field];
            }
        }
    });
    return validData;
};

const normalizeResponse = (table, data) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => normalizeResponse(table, item));

    // If no schema, return as is (but try to preserve id/created_at)
    if (!SCHEMAS[table]) return { ...data };

    const normalized = { ...data }; // Start with original data to keep 'id', 'created_at' etc.

    SCHEMAS[table].forEach(field => {
        // Check for exact match OR lowercase match
        const lowerField = field.toLowerCase();

        // If the field is missing but we have it in lowercase, map it
        if (normalized[field] === undefined && normalized[lowerField] !== undefined) {
            normalized[field] = normalized[lowerField];
        }
    });

    return normalized;
};

export const db = {
    getAll: async (table) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}`);
            if (!res.ok) {
                console.error(`Fetch error ${table}:`, res.statusText);
                return [];
            }
            const rawData = await res.json();
            return normalizeResponse(table, rawData);
        } catch (e) {
            console.error("DB Error:", e);
            return [];
        }
    },
    getById: async (table, id) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}&id=${id}`);
            if (!res.ok) return null;
            const rawData = await res.json();
            return normalizeResponse(table, rawData);
        } catch (e) {
            return null;
        }
    },
    add: async (table, item) => {
        try {
            const cleanItem = sanitize(table, item);
            const res = await fetch(`${API_URL}?type=${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanItem)
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error(`DB Add Failed (${res.status}):`, errText);
                throw new Error(`DB Error: ${errText}`);
            }

            return await res.json();
        } catch (e) {
            console.error("DB Add Error:", e);
            throw e; // Propagate error to caller
        }
    },
    update: async (table, id, updates) => {
        try {
            const cleanUpdates = sanitize(table, updates);
            const res = await fetch(`${API_URL}?type=${table}&id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanUpdates)
            });
            if (!res.ok) throw new Error("Update failed");
            return await res.json();
        } catch (e) {
            console.error("DB Update Error:", e);
            return null;
        }
    },
    delete: async (table, id) => {
        try {
            await fetch(`${API_URL}?type=${table}&id=${id}`, { method: 'DELETE' });
            return true;
        } catch (e) {
            console.error("DB Delete Error:", e);
            return false;
        }
    },
    authenticate: async (email, password) => {
        try {
            const users = await db.getAll('users');
            return users.find(u => u.email === email && u.password === password) || null;
        } catch (e) {
            return null;
        }
    }
};
