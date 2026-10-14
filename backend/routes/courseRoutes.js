const router = require('express').Router();
const { list, getOne } = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, list);
router.get('/:id', protect, getOne);

module.exports = router;