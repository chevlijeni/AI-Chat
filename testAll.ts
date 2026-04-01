import pool from './src/config/database';
import chatService from './src/services/chatService';
import { getChatHistory } from './src/services/dbService';

async function testAll() {
    try {
        console.log("1. Testing Database Connection...");
        const connection = await pool.getConnection();
        console.log("   Database connected.");

        console.log("2. Inserting/Retrieving Test User...");
        let userId;
        const [rows]: any = await connection.query("SELECT id FROM users WHERE google_id = 'test_google_id_123'");
        if (rows.length > 0) {
            userId = rows[0].id;
        } else {
            const [result]: any = await connection.query(
                "INSERT INTO users (google_id, email, display_name) VALUES ('test_google_id_123', 'test@example.com', 'Test User')"
            );
            userId = result.insertId;
        }
        console.log("   Test User ID:", userId);

        console.log("3. Testing Chat Service directly (This hits Gemini)...");
        const messages = [{ role: 'user', content: 'Please output exactly the following text and nothing else: "Test successful"' }];
        const response = await chatService.generateResponse(userId, messages);
        console.log("   AI Response:", response);

        console.log("4. Fetching Chat History...");
        const history = await getChatHistory(userId);
        console.log(`   Found ${history.length} messages in history.`);

        console.log("\nALL TESTS PASSED SUCCESSFULLY!");
        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

testAll();
