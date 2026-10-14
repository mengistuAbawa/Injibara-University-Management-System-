const router = require('express').Router();
const c = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('student'));

router.get('/my-profile',          c.getMyProfile);
router.get('/my-courses',          c.getMyCourses);
router.get('/my-grades',           c.getMyGrades);
router.get('/my-status',           c.getMyStatus);
router.get('/my-dormitory',        c.getMyDormitory);
router.get('/placement-tutorials', c.getPlacementTutorials);
router.get('/available-fields',    c.getAvailableFields);
router.post('/select-fields',      c.selectFields);
router.get('/selection-results',   c.getSelectionResults);
router.get('/priority-summary',    c.getPrioritySummary);

module.exports = router;