/** Public endpoints for admission applications and applicant status checks. */
const router = require('express').Router();
const controller = require('../controllers/applicantController');

router.get('/departments', controller.departments);
router.post('/apply', controller.apply);
router.get('/application-status', controller.applicationStatus);

module.exports = router;
