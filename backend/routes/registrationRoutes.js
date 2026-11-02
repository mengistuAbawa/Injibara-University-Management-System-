const router = require('express').Router();
const c = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/sections', c.listSections);
router.get('/mine', protect, authorize('student'), c.getMyRequest);
router.post('/requests', protect, authorize('student'), c.submitRequest);
router.get('/requests', protect, authorize('registrar', 'admin'), c.listRequests);
router.get('/requests/:requestId', protect, authorize('registrar', 'admin'), c.getRequest);
router.patch('/requests/:requestId/review', protect, authorize('registrar', 'admin'), c.reviewRequest);

module.exports = router;
