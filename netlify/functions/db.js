
import { neon } from '@neondatabase/serverless';


export const handler = async (event, context) => {
    // CORS headers for development
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    try {
        if (event.httpMethod === 'OPTIONS') {
            return { statusCode: 204, headers, body: '' };
        }

        // Diagnostic Ping (No DB required)
        if (event.queryStringParameters && event.queryStringParameters.ping) {
             return {
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pong', message: 'Function is running!' })
            };
        }

        if (!process.env.DATABASE_URL) {
            console.error("Missing DATABASE_URL");
            return {
                statusCode: 500,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Configuration Error: DATABASE_URL missing" })
            };
        }

        const sql = neon(process.env.DATABASE_URL);

        // Parse Query Parameters
        const query = event.queryStringParameters || {};
        const health = query.health;

        if (health) {
            try {
                await sql`SELECT 1`;
                return {
                    statusCode: 200,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'ok' })
                };
            } catch (e) {
                console.error("Health Check Failed:", e);
                return {
                    statusCode: 500,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'error', message: e.message })
                };
            }
        }

        const type = query.type; // table name
        const id = query.id;

        // Basic security check: only allow known tables
        const allowedTables = ['users', 'clients', 'tasks', 'meetings', 'files'];
        if (!type || !allowedTables.includes(type)) {
            throw new Error(`Invalid table type: ${type}`);
        }

        let result;

        switch (event.httpMethod) {
            case 'GET':
                if (id) {
                    // Get one
                    result = await sql(`SELECT * FROM ${type} WHERE id = $1`, [id]);
                    return {
                        statusCode: 200,
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify(result[0] || null)
                    };
                } else {
                    // Get all or filter
                    // Helper for simple equality filters from query params
                    const keys = [];
                    const values = [];
                    // queryStringParameters is an object, simpler iteration
                    Object.keys(query).forEach(key => {
                        if (key !== 'type' && key !== 'id') {
                            keys.push(`${key} = $${keys.length + 1}`);
                            values.push(query[key]);
                        }
                    });

                    if (keys.length > 0) {
                        result = await sql(`SELECT * FROM ${type} WHERE ${keys.join(' AND ')} ORDER BY created_at DESC`, values);
                    } else {
                        result = await sql(`SELECT * FROM ${type} ORDER BY created_at DESC`);
                    }
                }
                break;

            case 'POST':
                if (!event.body) throw new Error("Missing body");
                const body = JSON.parse(event.body);
                const columns = Object.keys(body);
                const values = Object.values(body);
                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

                if (columns.length === 0) throw new Error("No data to insert");

                result = await sql(`
          INSERT INTO ${type} (${columns.join(', ')}) 
          VALUES (${placeholders}) 
          RETURNING *
        `, values);

                return {
                    statusCode: 201,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(result[0])
                };

            case 'PUT':
                if (!id) throw new Error("ID required for update");
                if (!event.body) throw new Error("Missing body for update");
                const putBody = JSON.parse(event.body);
                const putColumns = Object.keys(putBody);
                const putValues = Object.values(putBody);

                const setClause = putColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');

                result = await sql(`
          UPDATE ${type} 
          SET ${setClause} 
          WHERE id = $${putValues.length + 1}
          RETURNING *
        `, [...putValues, id]);

                return {
                    statusCode: 200,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(result[0])
                };

            case 'DELETE':
                if (!id) throw new Error("ID required for delete");
                await sql(`DELETE FROM ${type} WHERE id = $1`, [id]);
                return {
                    statusCode: 200,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ success: true })
                };

            default:
                return { statusCode: 405, headers, body: "Method not allowed" };
        }

        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error("Global Handler Error:", error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            // Return the actual error message to the frontend so we can see it!
            body: JSON.stringify({ error: `Function Crash: ${error.message}`, stack: error.stack })
        };
    }
};
