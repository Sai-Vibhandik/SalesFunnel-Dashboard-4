const express = require('express');
const router = express.Router();
const {
  getLandingPages,
  getLandingPage,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  completeLandingPage,
  addNurturing,
  removeNurturing
} = require('../controllers/landingPageController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and require admin or performance_marketer role
router.use(protect);
router.use(authorize('admin', 'performance_marketer'));

// Landing page CRUD routes
router.route('/:projectId')
  .get(getLandingPages)                    // List all landing pages for project
  .post(createLandingPage);                // Create new landing page

router.route('/:projectId/:landingPageId')
  .get(getLandingPage)                     // Get single landing page
  .put(updateLandingPage)                  // Update landing page
  .delete(deleteLandingPage);              // Delete landing page

// Complete landing page and generate tasks
router.post('/:projectId/:landingPageId/complete', completeLandingPage);

// Nurturing routes (now require landingPageId)
router.post('/:projectId/:landingPageId/nurturing', addNurturing);
router.delete('/:projectId/:landingPageId/nurturing/:nurturingId', removeNurturing);

module.exports = router;