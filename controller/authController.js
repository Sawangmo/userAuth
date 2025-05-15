const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
require('dotenv').config();


const saltRounds = 10;


// Handles login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;


  try {
    // Check if user exists
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.render('pages/login', { message: 'Invalid credentials!' });
    }


    // Check if email is verified
    if (!user.is_verified) {
      return res.render('pages/login', { message: 'Please verify your email first.' });
    }


    // Compare password with hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('pages/login', { message: 'Invalid credentials!' });
    }


    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    // Set JWT in session (stored in cookies)
    res.cookie('jwt', token, { httpOnly: true });


    // Redirect based on role
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user/dashboard');
    }
  } catch (error) {
    console.error(error);
    res.render('pages/login', { message: 'Error during login.' });
  }
};


// Renders login form
exports.getLogin = (req, res) => {
  res.render('pages/login', { message: null });
};


// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Renders signup form
exports.getSignup = (req, res) => {
  res.render('pages/signup', { message: null });
};


// Handles signup form
exports.postSignup = async (req, res) => {
  const { name, email, password, role } = req.body;


  try {
    // Check if email exists
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.render('pages/signup', { message: 'Email already registered!' });
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);


    // Generate verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });


    // Insert user
    await db.none(
      `INSERT INTO users (name, email, password, role, verification_token)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, hashedPassword, role || 'user', verificationToken]
    );


    // Send verification email
    const verificationLink = `http://localhost:${process.env.PORT}/verify-email?token=${verificationToken}`;


    await transporter.sendMail({
      from: `"Sherubtse Auth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email',
      html: `<h3>Hello ${name},</h3><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
    });


    res.render('pages/signup', { message: 'Signup successful! Check your email to verify.' });
  } catch (error) {
    console.error(error);
    res.render('pages/signup', { message: 'Error during signup.' });
  }
};


// Email verification route
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;


    await db.none(`UPDATE users SET is_verified = true, verification_token = null WHERE email = $1`, [email]);


    res.send('✅ Email verified successfully. You can now log in.');
  } catch (error) {
    res.send('❌ Invalid or expired verification link.');
  }
};


// Sends a password reset link to the user email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
 
  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.render('pages/forgot-password', { message: 'Email not found' });
    }


    // Generate a password reset token (expires in 1 hour)
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });


    // Store the reset token in the database (could be used for future verification if needed)
    await db.none('UPDATE users SET reset_token = $1 WHERE email = $2', [resetToken, email]);


    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;


    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link below to reset your password:\n\n${resetLink}`,
    };


    await transporter.sendMail(mailOptions);
    res.render('pages/forgot-password', { message: 'Password reset link has been sent to your email.' });


  } catch (error) {
    console.error(error);
    res.render('pages/forgot-password', { message: 'Something went wrong. Please try again.' });
  }
};


// Renders forgot password page
exports.getForgotPassword = (req, res) => {
  res.render('pages/forgot-password', { message: null });
};


// Reset password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [decoded.email]);
   
    if (!user) {
      return res.render('pages/reset-password', { message: 'Invalid or expired token' });
    }


    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);


    // Update password in database
    await db.none('UPDATE users SET password = $1, reset_token = NULL WHERE email = $2', [hashedPassword, decoded.email]);


    res.render('pages/reset-password', { message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error(error);
    res.render('pages/reset-password', { message: 'Invalid or expired token' });
  }
};


// Renders reset password page
exports.getResetPassword = (req, res) => {
  const { token } = req.query;
  res.render('pages/reset-password', { token, message: null });
};
