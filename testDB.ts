import pool from './src/config/database';
async function test() {
    try {
        console.log("Testing DB...");
        const conn = await pool.getConnection();
        console.log("DB connection OK");
        conn.release();
        process.exit(0);
    } catch (e) {
        console.error("DB error:", e);
        process.exit(1);
    }
}
test();
