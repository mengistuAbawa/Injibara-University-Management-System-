const router = require('express').Router();
const c = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const financeController = require('../controllers/financeController');

router.use(protect, authorize('student'));

router.get('/my-profile',          c.getMyProfile);
router.get('/my-courses',          c.getMyCourses);
router.get('/my-grades',           c.getMyGrades);
router.get('/my-status',           c.getMyStatus);
router.get('/my-dormitory',        c.getMyDormitory);
router.get('/placement-tutorials', c.getPlacementTutorials);
router.get('/available-fields',    c.getAvailableFields);
router.get('/available-departments', c.getAvailableDepartments);
router.get('/my-field-priorities', c.getMyFieldPriorities);
router.get('/field-selection-status', c.getFieldSelectionStatus);
router.post('/select-fields',      c.selectFields);
router.get('/selection-results',   c.getSelectionResults);
router.get('/priority-summary',    c.getPrioritySummary);
router.get('/my-fees',             financeController.studentFees);

module.exports = router;
