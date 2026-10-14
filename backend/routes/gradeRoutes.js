const router = require('express').Router();
const { upsert } = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('instructor'), upsert);

module.exports = router;