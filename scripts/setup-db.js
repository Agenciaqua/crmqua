
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
    console.error("❌ ERRO: DATABASE_URL não encontrada no arquivo .env");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
    console.log("🔄 Iniciando configuração do Banco de Dados Neon...");

    try {
        // 1. Tabela Users
        await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("✅ Tabela 'users' verificada/criada.");

        // 2. Tabela Clients
        await sql`
        CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            contact TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'Lead',
            category TEXT,
            lastInteraction DATE,
            instagram TEXT,
            ownerId INTEGER,
            role TEXT,
            relationship TEXT,
            businessType TEXT,
            hasTraffic TEXT,
            website TEXT,
            prospectingDay TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
        console.log("✅ Tabela 'clients' verificada/criada.");

        // 3. Tabela Tasks
        await sql`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            assigneeId INTEGER,
            status TEXT DEFAULT 'Pendente',
            priority TEXT DEFAULT 'Media',
            dueDate DATE,
            description TEXT,
            type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
        console.log("✅ Tabela 'tasks' verificada/criada.");

        // 4. Tabela Meetings
        await sql`
        CREATE TABLE IF NOT EXISTS meetings (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            clientId INTEGER,
            date DATE,
            time TIME,
            duration TEXT,
            type TEXT,
            notes TEXT,
            status TEXT DEFAULT 'Agendada',
            ownerId INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
        console.log("✅ Tabela 'meetings' verificada/criada.");

        // 5. Tabela Files
        await sql`
        CREATE TABLE IF NOT EXISTS files (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            size TEXT,
            date DATE,
            ownerId INTEGER,
            recipientId INTEGER,
            category TEXT,
            notes TEXT,
            storageKey TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
        console.log("✅ Tabela 'files' verificada/criada.");

        console.log("🎉 Sucesso! Todas as tabelas foram configuradas.");

    } catch (error) {
        console.error("❌ Erro ao configurar banco:", error);
    }
}

setupDatabase();
