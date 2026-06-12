// Vercel serverless entry — exports the Express app as the handler.
require('dotenv').config();
const app = require('../app');

module.exports = app;
