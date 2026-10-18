/** Authenticated routes for graduated students. */
const router = require('express').Router();
const c = require('../controllers/alumniController');
const { protect } = require('../middleware/authMiddleware');
const alumniGuard = require('../middleware/alumniMiddleware');

router.use(protect, alumniGuard);
router.get('/profile', c.profile);
router.put('/profile', c.updateProfile);
router.get('/requests', c.requests);
router.post('/requests', c.createRequest);
router.get('/transcript', c.transcript);

module.exports = router;
