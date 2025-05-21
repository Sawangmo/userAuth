const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const { createUserTable } = require('./models/userModel');
const { createFoodTable } = require('./models/foodModel');

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: true,
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize tables
createUserTable();
createFoodTable();

// Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

// Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
