const router = require('express').Router();
const alumni = require('../controllers/alumniController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { requireAlumni } = require('../middleware/alumniMiddleware');

router.use(protect, authorize('student'), requireAlumni);
router.get('/profile', alumni.getProfile);
router.put('/profile', alumni.updateProfile);
router.get('/requests', alumni.getMyRequests);
router.post('/requests', alumni.submitRequest);
router.get('/transcript', alumni.getMyTranscript);

module.exports = router;
