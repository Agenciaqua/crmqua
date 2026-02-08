
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    // Basic protection - requires a secret query param if needed, or just run once quickly
    // For now, let's keep it open but obscure

    if (!process.env.DATABASE_URL) {
        return new Response("DATABASE_URL missing", { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);
    let logs = [];

    const log = (msg) => logs.push(msg);

    try {
        log("Starting migration...");

        // 1. Add 'source' to 'clients'
        try {
            await sql`ALTER TABLE clients ADD COLUMN source TEXT`;
            log("✅ Added 'source' column to 'clients'.");
        } catch (e) {
            log(`ℹ️ 'source' column issue: ${e.message}`);
        }

        // 2. Add 'ownerId' to 'tasks'
        try {
            await sql`ALTER TABLE tasks ADD COLUMN ownerId INTEGER`;
            log("✅ Added 'ownerId' column to 'tasks'.");
        } catch (e) {
            log(`ℹ️ 'ownerId' column issue: ${e.message}`);
        }

        return new Response(logs.join('\n'), { status: 200 });

    } catch (error) {
        return new Response(`Migration Error: ${error.message}\nLogs:\n${logs.join('\n')}`, { status: 500 });
    }
};
