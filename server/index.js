require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Trot TK invoice API running on http://localhost:${PORT}`);
});
