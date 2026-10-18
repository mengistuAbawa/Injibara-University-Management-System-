const router = require('express').Router();
const c = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/requests', authorize('registrar', 'admin'), c.listRequests);
router.get('/requests/:requestId', authorize('registrar', 'admin'), c.getRequest);
router.patch('/requests/:requestId/review', authorize('registrar', 'admin'), c.reviewRequest);

module.exports = router;
