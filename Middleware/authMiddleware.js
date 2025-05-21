const jwt = require('jsonwebtoken');

// Middleware to check if the user is an admin
exports.isAdmin = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.redirect('/login');
    }

    if (decoded.role !== 'admin') {
      return res.redirect('/user/dashboard'); // Redirect unauthorized admins
    }

    req.user = decoded; // Optional: attach user to request
    next();
  });
};

// Middleware to check if any authenticated user (admin or user)
exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.redirect('/login');
    }

    req.user = decoded; // Attach user info to request
    next();
  });
};
