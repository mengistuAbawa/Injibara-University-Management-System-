const router = require('express').Router();
const c = require('../controllers/instructorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

/* All routes require instructor role */
router.use(protect, authorize('instructor'));

/* dashboard */
router.get('/stats',                              c.getStats);

/* sections */
router.get('/my-sections',                        c.getMySections);
router.get('/sections/:sectionId',                c.getSection);
router.get('/sections/:sectionId/students',       c.getSectionStudents);
router.get('/sections/:sectionId/performance',    c.getSectionPerformance);

/* grades */
router.post('/grades/bulk',                       c.bulkEnterGrades);
router.post('/grade',                             c.updateGrade);

/* attendance */
router.post('/attendance',                        c.saveAttendance);
router.get('/sections/:sectionId/attendance',     c.getAttendance);

module.exports = router;