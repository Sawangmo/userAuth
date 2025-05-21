const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const saltRounds = 10;

// Email transporter (reuse instead of redefining)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// -------------------- LOGIN --------------------
exports.getLogin = (req, res) => {
  res.render('pages/login', { message: null });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.render('pages/login', { message: 'Invalid credentials!' });

    if (!user.is_verified) {
      return res.render('pages/login', { message: 'Please verify your email first.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('pages/login', { message: 'Invalid credentials!' });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('jwt', token, { httpOnly: true });
    return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { message: 'Error during login.' });
  }
};

// -------------------- SIGNUP --------------------
exports.getSignup = (req, res) => {
  res.render('pages/signup', { message: null });
};

exports.postSignup = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.render('pages/signup', { message: 'Email already registered!' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await db.none(
      `INSERT INTO users (name, email, password, role, verification_token)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, hashedPassword, role || 'user', verificationToken]
    );

    const verificationLink = `http://localhost:${process.env.PORT}/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"Sherubtse Auth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email',
      html: `<h3>Hello ${name},</h3><p>Please verify your email by clicking the link below:</p><a href="${verificationLink}">Verify Email</a>`,
    });

    res.render('pages/signup', { message: 'Signup successful! Check your email to verify.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.render('pages/signup', { message: 'Error during signup.' });
  }
};

// -------------------- EMAIL VERIFICATION --------------------
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    await db.none(
      `UPDATE users SET is_verified = true, verification_token = null WHERE email = $1`,
      [email]
    );

    res.send('✅ Email verified successfully. You can now log in.');
  } catch (error) {
    console.error('Email verification error:', error);
    res.send('❌ Invalid or expired verification link.');
  }
};

// -------------------- FORGOT PASSWORD --------------------
exports.getForgotPassword = (req, res) => {
  res.render('pages/forgot-password', { message: null });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.render('pages/forgot-password', { message: 'Email not found' });

    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await db.none('UPDATE users SET reset_token = $1 WHERE email = $2', [resetToken, email]);

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link below to reset your password:\n\n${resetLink}`,
    });

    res.render('pages/forgot-password', { message: 'Password reset link has been sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.render('pages/forgot-password', { message: 'Something went wrong. Please try again.' });
  }
};

// -------------------- RESET PASSWORD --------------------
exports.getResetPassword = (req, res) => {
  const { token } = req.query;
  res.render('pages/reset-password', { token, message: null });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [decoded.email]);

    if (!user) {
      return res.render('pages/reset-password', { message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.none(
      'UPDATE users SET password = $1, reset_token = NULL WHERE email = $2',
      [hashedPassword, decoded.email]
    );

    res.render('pages/reset-password', { message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.render('pages/reset-password', { message: 'Invalid or expired token' });
  }
};
