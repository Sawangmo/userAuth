const db = require('../config/db');

const createFoodTable = async () => {
  try {
    await db.none(`
      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ food_items table ensured.");
  } catch (err) {
    console.error("❌ Error creating food_items table:", err.message || err);
  }
};

module.exports = {
  createFoodTable
};
