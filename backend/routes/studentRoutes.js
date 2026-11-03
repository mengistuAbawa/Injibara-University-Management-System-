const router = require('express').Router();
const c = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const financeController = require('../controllers/financeController');
const { rejectGraduatedStudent } = require('../middleware/alumniMiddleware');

router.use(protect, authorize('student'), rejectGraduatedStudent);

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
router.post('/cost-sharing/step1', c.submitCostSharingForm);
router.get('/cost-sharing/current', c.getCurrentCostSharingForm);
router.patch('/cost-sharing/:formId/sign', c.signCostSharingAgreement);

module.exports = router;
