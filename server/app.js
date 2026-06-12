require('express-async-errors');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true,
    credentials: true,
  })
);
app.use(express.json());

// Ensure a DB connection before handling any API request (serverless-friendly).
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Centralized error handler.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value', detail: err.keyValue });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
