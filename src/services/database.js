const API_URL = '/.netlify/functions/db';

export const db = {
    healthCheck: async () => {
        try {
            const res = await fetch(`${API_URL}?health=true`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                return { ok: false, message: err.error || err.message || `HTTP ${res.status}` };
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, message: e.message };
        }
    },
    getAll: async (table) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
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
            const res = await fetch(`${API_URL}?type=${table}&id=${id}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    },
    getByEmail: async (email) => {
        try {
            const res = await fetch(`${API_URL}?type=users&email=${encodeURIComponent(email)}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!res.ok) return null;
            const users = await res.json();
            return (users && users.length > 0) ? users[0] : null;
        } catch (e) {
            console.error("GetByEmail Error:", e);
            throw e;
        }
    },
    add: async (table, item) => {
        try {
            const res = await fetch(`${API_URL}?type=${table}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || err.message || "Add failed");
            }
            return await res.json();
        } catch (e) {
            console.error("DB Add Error:", e);
            throw e;
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
            const user = await db.getByEmail(email);
            if (user && user.password === password) {
                return user;
            }
            return null;
        } catch (e) {
            console.error("Auth Error:", e);
            throw e;
        }
    }
};
