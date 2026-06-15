// Vercel serverless entry. Files in the root /api directory are auto-detected
// as Node serverless functions. The vercel.json rewrite sends every /api/*
// request here; Express handles the internal routing (/api/auth, /api/clients…).
require('dotenv').config();
module.exports = require('../server/app');
