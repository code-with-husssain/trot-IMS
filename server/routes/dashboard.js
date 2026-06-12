const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', ctrl.metrics);

module.exports = router;
