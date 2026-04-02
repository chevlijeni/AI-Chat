import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
import expressSession from 'express-session';
// @ts-ignore
import MySQLStoreFactory from 'express-mysql-session';

dotenv.config();

const dbConfig: any = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL_CA ? {
        ca: process.env.DB_SSL_CA,
        rejectUnauthorized: true
    } : undefined
};

// Create connection pool
const pool: Pool = mysql.createPool(dbConfig);

// Create session store using express-mysql-session
import session from 'express-session';
// @ts-ignore
import MySQLStoreFactory from 'express-mysql-session';

const MySQLStore = MySQLStoreFactory(session as any);
export const sessionStore = new MySQLStore({}, pool as any);

// Initialize database schema automatically
export async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();

        // Create Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                google_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                display_name VARCHAR(255) NOT NULL,
                avatar_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Chat Sessions Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) DEFAULT 'New Chat',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create Chat History Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                user_id INT NOT NULL,
                role ENUM('user', 'ai', 'system') NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Database schema initialized.');
        connection.release();
    } catch (error) {
        console.warn('⚠️ Warning: MySQL connection failed. Database schemas were not initialized and history will not work. Continuing to start the server for UI testing.');
        // Don't throw the error, just let the promise resolve
    }
}

export default pool;
