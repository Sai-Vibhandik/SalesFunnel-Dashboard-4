const express = require('express');
const router = express.Router();
const {
  getCreativeStrategy,
  upsertCreativeStrategy,
  addCreative,
  updateCreative,
  deleteCreative,
  generateCreativeCards,
  addAdType,
  removeAdType,
  updateAdType,
  updateAdditionalNotes
} = require('../controllers/creativeController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin or performance_marketer role
router.use(protect);
router.use(authorize('admin', 'performance_marketer'));

// Creative strategy routes
router.route('/:projectId')
  .get(getCreativeStrategy)
  .post(upsertCreativeStrategy);

// Generate creative cards
router.post('/:projectId/generate', generateCreativeCards);

// Ad type routes
router.post('/:projectId/ad-types', addAdType);
router.put('/:projectId/ad-types/:typeKey', updateAdType);
router.delete('/:projectId/ad-types/:typeKey', removeAdType);

// Additional notes
router.put('/:projectId/notes', updateAdditionalNotes);

// Creative item routes
router.post('/:projectId/stages/:stage/creatives', addCreative);
router.put('/:projectId/stages/:stage/creatives/:creativeId', updateCreative);
router.delete('/:projectId/stages/:stage/creatives/:creativeId', deleteCreative);

module.exports = router;