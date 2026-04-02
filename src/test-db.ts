import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    console.log("🔍 Testing connection to Aiven MySQL...");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL_CA ? {
                ca: process.env.DB_SSL_CA,
                rejectUnauthorized: true
            } : undefined
        });

        console.log("✅ Successfully connected to Aiven!");
        const [rows] = await connection.query('SELECT 1 + 1 AS result');
        console.log("🧪 Query test (1+1):", (rows as any)[0].result);

        await connection.end();
        console.log("👋 Connection closed.");
    } catch (error) {
        console.error("❌ Connection failed!");
        console.error(error);
    }
}

testConnection();
