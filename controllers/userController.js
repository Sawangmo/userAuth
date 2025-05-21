const db = require('../config/db');

// Render User Dashboard
exports.getDashboard = (req, res) => {
  // Optionally, you can pass user info from session/JWT here
  res.render('user/dashboard', { message: null });
};

// Fetch and Render All Food Items
exports.getAllFoods = async (req, res) => {
  try {
    const foods = await db.any('SELECT * FROM food_items ORDER BY created_at DESC');
    res.render('user/food', { foods });
  } catch (err) {
    console.error('❌ Error fetching food items:', err.message); // Log only the message
    res.status(500).send('Server Error');
  }
};
