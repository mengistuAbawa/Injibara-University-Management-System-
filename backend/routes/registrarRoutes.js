const router = require('express').Router();
const c = require('../controllers/registrarController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const accessRequests = require('../controllers/accessRequestController');

/* every route requires registrar (or admin) role */
router.use(protect, authorize('registrar', 'admin'));
router.get('/access-requests', accessRequests.list);
router.patch('/access-requests/:requestId', accessRequests.review);
router.get('/instructors/:instructorId/sections', c.getInstructorAssignableSections);
router.patch('/instructors/:instructorId/sections/:sectionId', c.assignInstructorSection);
router.get('/accounts/students', c.listStudentAccounts);
router.patch('/accounts/students/:userId/password', c.resetStudentPassword);

/* dashboard */
router.get('/stats',                         c.getStats);

/* students */
router.post('/students',                     c.createStudent);
router.get('/students/search',               c.searchStudents);
router.get('/students/:studentId',           c.getStudent);
router.put('/students/:studentId',           c.updateStudent);

/* enrollments */
router.get('/sections',                      c.listSections);
router.get('/offerings',                     c.listDepartmentOfferings);
router.post('/sections',                     c.createSection);
router.get('/sections/:sectionId/students',  c.getSectionStudents);
router.post('/enrollments',                  c.enrollStudent);
router.get('/students/:studentId/enrollments', c.getStudentEnrollments);
router.patch('/enrollments/:enrollmentId/drop', c.dropEnrollment);

/* results */
router.post('/results/publish',              c.publishResult);
router.post('/results/bulk-publish',         c.bulkPublishResults);

/* transcript */
router.get('/transcript/:studentId',         c.getTranscript);

/* cost sharing registration */
router.post('/cost-sharing/step1', c.saveCostSharingStep1);
router.get('/cost-sharing/:formId/step2', c.getCostSharingStep2);
router.patch('/cost-sharing/:formId/sign', c.signCostSharingForm);

module.exports = router;
