const express = require('express');
const router = express.Router();
const {
  getCompleteStrategy,
  markStrategyReviewed,
  getPendingReviewStrategies,
  getStrategyStats
} = require('../controllers/strategyController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get pending review strategies (Admin only)
router.get('/pending-review', getPendingReviewStrategies);

// Get strategy stats (Admin only)
router.get('/stats', getStrategyStats);

// Get complete strategy for a project
router.get('/:projectId', getCompleteStrategy);

// Mark strategy as reviewed (Admin only)
router.put('/:projectId/review', markStrategyReviewed);

module.exports = router;