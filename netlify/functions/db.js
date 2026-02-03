
import { neon } from '@neondatabase/serverless';

export default async (req, context) => {
    // CORS headers for development
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    if (!process.env.DATABASE_URL) {
        return new Response(JSON.stringify({ error: "Configuration Error: DATABASE_URL missing" }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    const sql = neon(process.env.DATABASE_URL);
    const url = new URL(req.url);
    const health = url.searchParams.get('health');
    if (health) {
        try {
            await sql`SELECT 1`;
            return new Response(JSON.stringify({ status: 'ok' }), { headers: { ...headers, 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ status: 'error', message: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
        }
    }

    const type = url.searchParams.get('type'); // table name
    const id = url.searchParams.get('id');

    try {
        // Basic security check: only allow known tables
        const allowedTables = ['users', 'clients', 'tasks', 'meetings', 'files'];
        if (!type || !allowedTables.includes(type)) {
            throw new Error(`Invalid table type: ${type}`);
        }

        let result;

        switch (req.method) {
            case 'GET':
                if (id) {
                    // Get one
                    result = await sql(`SELECT * FROM ${type} WHERE id = $1`, [id]);
                    return new Response(JSON.stringify(result[0] || null), {
                        headers: { ...headers, 'Content-Type': 'application/json' }
                    });
                } else {
                    // Get all or filter
                    // Helper for simple equality filters from query params
                    const keys = [];
                    const values = [];
                    for (const [key, value] of url.searchParams) {
                        if (key !== 'type' && key !== 'id') {
                            keys.push(`${key} = $${keys.length + 1}`);
                            values.push(value);
                        }
                    }

                    if (keys.length > 0) {
                        result = await sql(`SELECT * FROM ${type} WHERE ${keys.join(' AND ')} ORDER BY created_at DESC`, values);
                    } else {
                        result = await sql(`SELECT * FROM ${type} ORDER BY created_at DESC`);
                    }
                }
                break;

            case 'POST':
                const body = await req.json();
                const columns = Object.keys(body);
                const values = Object.values(body);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                // Safe interpolation for columns (assuming trusted input from trusted frontend, but could be better)
                // Ideally should validate columns against schema
                if (columns.length === 0) throw new Error("No data to insert");

                result = await sql(`
          INSERT INTO ${type} (${columns.join(', ')}) 
          VALUES (${placeholders}) 
          RETURNING *
        `, values);

                // Return the inserted object (compatible with old alasql behavior)
                return new Response(JSON.stringify(result[0]), {
                    status: 201,
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });

            case 'PUT':
                if (!id) throw new Error("ID required for release");
                const putBody = await req.json();
                const putColumns = Object.keys(putBody);
                const putValues = Object.values(putBody);

                const setClause = putColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');

                result = await sql(`
          UPDATE ${type} 
          SET ${setClause} 
          WHERE id = $${putValues.length + 1}
          RETURNING *
        `, [...putValues, id]);

                return new Response(JSON.stringify(result[0]), {
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });

            case 'DELETE':
                if (!id) throw new Error("ID required for delete");
                await sql(`DELETE FROM ${type} WHERE id = $1`, [id]);
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });

            default:
                return new Response("Method not allowed", { status: 405, headers });
        }

        return new Response(JSON.stringify(result), {
            headers: { ...headers, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Database Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
};
