const router = require('express').Router();
const { login } = require('../controllers/authController');
const accessRequests = require('../controllers/accessRequestController');
router.post('/login', login);
router.get('/departments', accessRequests.listDepartments);
router.post('/access-requests', accessRequests.submit);
module.exports = router;
