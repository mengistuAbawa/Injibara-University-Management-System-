const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const accessRequests = require('../controllers/accessRequestController');
const alumni = require('../controllers/alumniController');

/* every route requires admin role */
router.use(protect, authorize('admin'));
router.get('/access-requests', accessRequests.list);
router.patch('/access-requests/:requestId', accessRequests.review);
router.get('/alumni-requests', alumni.adminList);
router.patch('/alumni-requests/:id', alumni.adminUpdate);

/* dashboard */
router.get('/stats',                           c.getStats);

/* users */
router.get('/users',                           c.listUsers);
router.post('/users',                          c.createUser);
router.put('/users/:userId',                   c.updateUser);
router.delete('/users/:userId',                c.deleteUser);
router.patch('/users/:userId/toggle',          c.toggleUserActive);
router.patch('/users/:userId/role',            c.changeUserRole);
router.post('/users/:userId/reset-password',   c.resetUserPassword);

/* departments */
router.get('/colleges',                        c.listColleges);
router.post('/colleges',                       c.createCollege);
router.put('/colleges/:id',                    c.updateCollege);
router.delete('/colleges/:id',                 c.deleteCollege);
router.get('/departments',                     c.listDepartments);
router.post('/departments',                    c.createDepartment);
router.put('/departments/:id',                 c.updateDepartment);
router.delete('/departments/:id',              c.deleteDepartment);

/* courses */
router.get('/courses',                         c.listCourses);
router.post('/courses',                        c.createCourse);
router.put('/courses/:id',                     c.updateCourse);
router.delete('/courses/:id',                  c.deleteCourse);

/* sections */
router.get('/sections',                        c.listSections);
router.post('/sections',                       c.createSection);
router.put('/sections/:id',                    c.updateSection);
router.delete('/sections/:id',                 c.deleteSection);

/* fields */
router.get('/fields',                          c.listFields);
router.post('/fields',                         c.createField);
router.put('/fields/:id',                       c.updateField);
router.delete('/fields/:id',                   c.deleteField);

/* directories */
router.get('/students',                        c.listStudents);
router.get('/instructors',                     c.listInstructors);

/* HOD assignment */
router.post('/instructors/promote-hod',        c.promoteToHod);
router.patch('/instructors/:instructorId/demote-hod', c.demoteHod);

/* settings */
router.get('/settings',                        c.getSettings);
router.put('/settings',                        c.updateSettings);

/* results */
router.post('/results/bulk-publish',           c.bulkPublishResults);

/* reports */
router.get('/report',                          c.getReport);
router.get('/login-log',                       c.getLoginLog);
router.get('/sms-log',                         c.getSmsLog);
router.post('/allocation/run',                 c.runAllocation);

module.exports = router;
