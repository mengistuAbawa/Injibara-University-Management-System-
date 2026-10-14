const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

router.use(protect);
router.put('/avatar', profileController.uploadAvatar);

module.exports = router;
