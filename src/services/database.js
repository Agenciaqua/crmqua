const API_URL = '/.netlify/functions/db';

export const db = {
    getAll: async (table) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}`);
            if (!res.ok) {
                console.error(`Fetch error ${table}:`, res.statusText);
                return [];
            }
            return await res.json();
        } catch (e) {
            console.error("DB Error:", e);
            return [];
        }
    },
    getById: async (table, id) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}&id=${id}`);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    },
    add: async (table, item) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!res.ok) throw new Error("Add failed");
            return await res.json();
        } catch (e) {
            console.error("DB Add Error:", e);
            return null;
        }
    },
    update: async (table, id, updates) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}&id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
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
