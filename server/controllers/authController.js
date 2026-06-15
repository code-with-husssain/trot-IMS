const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).select('name email role');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

// One-time bootstrap: create the admin from env vars without running a local script.
// - If NO admin exists yet, it seeds freely (idempotent first-run bootstrap).
// - Once an admin exists, the endpoint is locked unless the caller provides the
//   correct `secret` matching SEED_SECRET (used to force a password reset).
exports.seed = async (req, res) => {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = process.env.ADMIN_NAME || 'Trot TK Admin';
  if (!email || !password) {
    return res.status(500).json({ message: 'ADMIN_EMAIL and ADMIN_PASSWORD must be set in env' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const provided = (req.body && req.body.secret) || req.query.secret;
    if (!process.env.SEED_SECRET || provided !== process.env.SEED_SECRET) {
      return res.status(409).json({ message: 'Admin already exists. Provide a valid secret to reset.' });
    }
    existing.name = name;
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
    return res.json({ message: 'Admin password reset', email });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash, role: 'admin' });
  res.status(201).json({ message: 'Admin created', email });
};
