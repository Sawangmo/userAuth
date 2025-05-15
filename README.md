# userAuth
const pgp = require('pg-promise')();
require('dotenv').config();


const db = pgp({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
});


module.exports = db;

This code define a Node.js app with a PostgreSQL database using 'pg-promise'. It loads database settings (host, name, user, password) from '.env' file for security, and it exports the connectionto reuse elsewhere in the application.

