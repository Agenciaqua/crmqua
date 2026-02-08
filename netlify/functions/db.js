
import { neon } from '@neondatabase/serverless';


export const handler = async (event, context) => {
    console.log("Function Updated: " + new Date().toISOString());
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

        // Use process.env OR fallback to the user-provided URL (Critical Fix requested by User)
        let connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_QfdY9V0ybcZz@ep-silent-hill-acfawx0o-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

        if (!connectionString) {
            console.error("Missing DATABASE_URL");
            return {
                statusCode: 500,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Configuration Error: DATABASE_URL missing" })
            };
        }

        // SMART FIX: Clean connection string if user copied the full "psql" command
        if (connectionString.startsWith("psql")) {
            // Remove "psql '" prefix and trailing "'"
            connectionString = connectionString.replace(/^psql\s+'/, '').replace(/'$/, '');
            console.log("Sanitized DATABASE_URL: Removed 'psql' command wrapper.");
        }

        const sql = neon(connectionString);

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
                    result = await sql.query(`SELECT * FROM ${type} WHERE id = $1`, [id]);
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
                        result = await sql.query(`SELECT * FROM ${type} WHERE ${keys.join(' AND ')} ORDER BY created_at DESC`, values);
                    } else {
                        result = await sql.query(`SELECT * FROM ${type} ORDER BY created_at DESC`);
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

                try {
                    result = await sql.query(`
                      INSERT INTO ${type} (${columns.join(', ')}) 
                      VALUES (${placeholders}) 
                      RETURNING *
                    `, values);
                } catch (err) {
                    // Self-healing: Detect missing columns and add them dynamically
                    const missingColumnMatch = err.message.match(/column "(.+)" of relation ".+" does not exist/);

                    if (missingColumnMatch) {
                        const missingCol = missingColumnMatch[1];
                        console.log(`⚠️ Auto-fixing DB: Adding missing column '${missingCol}' to '${type}'...`);

                        // Add the column with a generic type (TEXT is safest mostly, or INTEGER for Id)
                        // Heuristic for types based on name suffix
                        const colType = missingCol.endsWith('Id') ? 'INTEGER' : 'TEXT';

                        await sql.query(`ALTER TABLE ${type} ADD COLUMN IF NOT EXISTS ${missingCol} ${colType}`);

                        // Retry the insertion
                        result = await sql.query(`
                          INSERT INTO ${type} (${columns.join(', ')}) 
                          VALUES (${placeholders}) 
                          RETURNING *
                        `, values);
                    } else {
                        // Re-throw if it's not a missing column error
                        throw err;
                    }
                }

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

                try {
                    result = await sql.query(`
                      UPDATE ${type} 
                      SET ${setClause} 
                      WHERE id = $${putValues.length + 1}
                      RETURNING *
                    `, [...putValues, id]);
                } catch (err) {
                    // Self-healing for UPDATE as well
                    const missingColumnMatch = err.message.match(/column "(.+)" of relation ".+" does not exist/);
                    if (missingColumnMatch) {
                        const missingCol = missingColumnMatch[1];
                        console.log(`⚠️ Auto-fixing DB (Update): Adding missing column '${missingCol}' to '${type}'...`);
                        const colType = missingCol.endsWith('Id') ? 'INTEGER' : 'TEXT';
                        await sql.query(`ALTER TABLE ${type} ADD COLUMN IF NOT EXISTS ${missingCol} ${colType}`);

                        // Retry
                        result = await sql.query(`
                           UPDATE ${type} 
                           SET ${setClause} 
                           WHERE id = $${putValues.length + 1}
                           RETURNING *
                         `, [...putValues, id]);
                    } else {
                        throw err;
                    }
                }

                return {
                    statusCode: 200,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(result[0])
                };

            case 'DELETE':
                if (!id) throw new Error("ID required for delete");
                await sql.query(`DELETE FROM ${type} WHERE id = $1`, [id]);
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
