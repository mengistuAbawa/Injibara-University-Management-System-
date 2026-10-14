const router = require('express').Router();
const { enroll, listByStudent } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('admin', 'registrar'), enroll);
router.get('/student/:studentId', protect, authorize('admin', 'registrar'), listByStudent);

module.exports = router;