const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../Middleware/authMiddleware');  // Removed extra space
const userController = require('../controllers/userController');

router.get('/dashboard', isAuthenticated, userController.getDashboard);

router.get('/foods', isAuthenticated, userController.getAllFoods);

module.exports = router;
