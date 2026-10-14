const router = require('express').Router();
const { list, create } = require('../controllers/fieldController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, list);
router.post('/', protect, authorize('admin', 'registrar'), create);

module.exports = router;