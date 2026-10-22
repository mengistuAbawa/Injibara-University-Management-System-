const router = require('express').Router();
const c = require('../controllers/hodController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireHod } = require('../middleware/hodMiddleware');

/* every route requires: valid JWT + instructor role + is_hod flag */
router.use(protect, authorize('instructor'), requireHod);

/* dashboard */
router.get('/overview',                c.getOverview);

/* department resources */
router.get('/instructors',             c.listInstructors);
router.get('/courses',                 c.listCourses);
router.get('/sections',                c.listSections);
router.put('/sections/:sectionId',      c.updateSection);
router.get('/students',                c.listStudents);

/* assignment */
router.post('/assign',                 c.assignInstructor);
router.delete('/sections/:sectionId/unassign', c.unassignInstructor);

/* reports */
router.get('/performance',             c.getPerformance);
router.get('/grade-distribution',      c.getGradeDistribution);

module.exports = router;
