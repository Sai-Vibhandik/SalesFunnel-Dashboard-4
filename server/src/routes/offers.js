const express = require('express');
const router = express.Router();
const {
  getOffer,
  upsertOffer,
  addBonus,
  removeBonus
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin or performance_marketer role
router.use(protect);
router.use(authorize('admin', 'performance_marketer'));

// Offer routes
router.route('/:projectId')
  .get(getOffer)
  .post(upsertOffer);

// Bonus routes
router.post('/:projectId/bonuses', addBonus);
router.delete('/:projectId/bonuses/:bonusId', removeBonus);

module.exports = router;