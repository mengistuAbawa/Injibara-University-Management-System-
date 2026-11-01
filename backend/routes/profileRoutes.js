const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

router.use(protect);
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/avatar', profileController.uploadAvatar);

module.exports = router;
