const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/seed', ctrl.seed);
router.get('/me', auth, ctrl.me);

module.exports = router;
