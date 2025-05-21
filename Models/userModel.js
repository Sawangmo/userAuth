const db = require('../config/db');

// Create user table if it does not exist
const createUserTable = async () => {
  try {
    await db.none(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL CHECK (email LIKE '%@%'),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_verified BOOLEAN DEFAULT false,
        verification_token TEXT,
        reset_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ users table ensured.");
  } catch (err) {
    console.error("❌ Error creating users table:", err.message || err);
  }
};

module.exports = {
  createUserTable
};
