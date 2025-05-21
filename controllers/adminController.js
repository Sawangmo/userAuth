const db = require('../config/db');

// Admin Dashboard
exports.getDashboard = (req, res) => {
  res.render('admin/dashboard', { message: null });
};

// GET: Add Food Form
exports.getAddFood = (req, res) => {
  res.render('admin/addFood');
};

// POST: Handle Food Submission
exports.postAddFood = async (req, res) => {
  try {
    const { name, description, image_url, price } = req.body;

    // Basic validation
    if (!name || !price) {
      return res.status(400).send('Name and Price are required.');
    }

    await db.none(
      `
      INSERT INTO food_items (name, description, image_url, price)
      VALUES ($1, $2, $3, $4)
      `,
      [name, description || '', image_url || '', price]
    );

    res.redirect('/admin/food');
  } catch (err) {
    console.error('❌ Error inserting food:', err);
    res.status(500).send('Server Error');
  }
};

// GET: All Foods
exports.getAllFoods = async (req, res) => {
  try {
    const foods = await db.any('SELECT * FROM food_items ORDER BY created_at DESC');
    res.render('admin/foodList', { foods });
  } catch (err) {
    console.error('❌ Error fetching food items:', err);
    res.status(500).send('Server Error');
  }
};

// GET: Show Edit Form
exports.getEditFood = async (req, res) => {
  const { id } = req.params;
  try {
    const food = await db.oneOrNone('SELECT * FROM food_items WHERE id = $1', [id]);
    if (!food) {
      return res.status(404).send('Food item not found');
    }
    res.render('admin/editFood', { food });
  } catch (err) {
    console.error('❌ Error loading edit form:', err);
    res.status(500).send('Server Error');
  }
};

// POST: Handle Edit Submission
exports.postEditFood = async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, price } = req.body;
  try {
    await db.none(
      `
      UPDATE food_items
      SET name = $1, description = $2, image_url = $3, price = $4
      WHERE id = $5
      `,
      [name, description || '', image_url || '', price, id]
    );

    res.redirect('/admin/food');
  } catch (err) {
    console.error('❌ Error updating food:', err);
    res.status(500).send('Server Error');
  }
};

// POST or DELETE: Delete Food
exports.deleteFood = async (req, res) => {
  const { id } = req.params;
  try {
    await db.none('DELETE FROM food_items WHERE id = $1', [id]);
    res.redirect('/admin/food');
  } catch (err) {
    console.error('❌ Error deleting food:', err);
    res.status(500).send('Server Error');
  }
};
