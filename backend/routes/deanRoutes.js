/** Protected college-scoped API routes available only to assigned deans. */
const router = require('express').Router();
const c = require('../controllers/deanController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireDean } = require('../middleware/deanMiddleware');

router.use(protect, authorize('instructor'), requireDean);
router.get('/overview', c.getOverview);
router.get('/statistics', c.getStatistics);
router.get('/allocation-results', c.getAllocationResults);
router.get('/departments', c.getDepartments);
router.post('/departments', c.createDepartment);
router.put('/departments/:id', c.updateDepartment);
router.get('/courses', c.getCourses);
router.get('/departments/:id/offerings', c.getOfferings);
router.post('/departments/:id/offerings', c.createOffering);
router.delete('/offerings/:offeringId', c.deleteOffering);
router.get('/grade-uploads', c.getPendingGrades);
router.patch('/grade-uploads/:sectionId', c.reviewGradeUpload);
router.get('/hods', c.getHods);
router.get('/hods/:instructorId/performance', c.getHodPerformance);
router.get('/grades/pending', c.getPendingGrades);
router.patch('/grades/:gradeId/review', c.reviewGrade);
router.get('/performance', c.getPerformance);
router.get('/ng-students', c.getNgStudents);
router.get('/top-students', c.getTopStudents);
router.get('/allocation', c.getAllocation);

module.exports = router;
