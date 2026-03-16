const express = require('express');
const router = express.Router();
const {
  getTrafficStrategy,
  upsertTrafficStrategy,
  addHook,
  removeHook,
  toggleChannel
} = require('../controllers/trafficStrategyController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin or performance_marketer role
router.use(protect);
router.use(authorize('admin', 'performance_marketer'));

// Traffic strategy routes
router.route('/:projectId')
  .get(getTrafficStrategy)
  .post(upsertTrafficStrategy);

// Hook routes
router.post('/:projectId/hooks', addHook);
router.delete('/:projectId/hooks/:hookId', removeHook);

// Channel routes
router.patch('/:projectId/channels/:channelName', toggleChannel);

module.exports = router;