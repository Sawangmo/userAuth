const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Admin Dashboard
router.get('/dashboard', isAdmin, adminController.getDashboard);

// Add Food
router.get('/add-food', isAdmin, adminController.getAddFood);
router.post('/add-food', isAdmin, adminController.postAddFood);

// View All Foods
router.get('/food', isAdmin, adminController.getAllFoods);

// Edit Food
router.get('/edit-food/:id', isAdmin, adminController.getEditFood);
router.post('/edit-food/:id', isAdmin, adminController.postEditFood);

// Delete Food
router.post('/delete-food/:id', isAdmin, adminController.deleteFood);

module.exports = router;
