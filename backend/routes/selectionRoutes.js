const router = require('express').Router();
const { publishResult } = require('../controllers/selectionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/publish', protect, authorize('admin', 'registrar'), publishResult);

module.exports = router;