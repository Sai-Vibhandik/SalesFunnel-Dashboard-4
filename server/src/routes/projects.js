const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectProgress,
  getDashboardStats,
  assignTeam,
  toggleProjectActivation,
  uploadAssets,
  getAssignedProjects,
  // Landing Pages
  addLandingPage,
  getLandingPages,
  getLandingPage,
  updateLandingPage,
  deleteLandingPage,
  completeLandingPageStage
} = require('../controllers/projectController');
const {
  getStrategySummary,
  getStrategySummaryText,
  getStrategySummaryPdf,
  getTaskContext
} = require('../controllers/strategySummaryController');
const { protect, authorize } = require('../middleware/auth');
const { handleUpload, uploadBrandAssets } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Assigned projects
router.get('/assigned', getAssignedProjects);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(authorize('admin'), deleteProject);

router.route('/:id/progress').get(getProjectProgress);

// Team assignment (Admin only)
router.put('/:id/assign-team', authorize('admin'), assignTeam);

// Project activation (Admin only)
router.put('/:id/activate', authorize('admin'), toggleProjectActivation);

// Brand assets upload
router.post('/:id/assets', handleUpload(uploadBrandAssets), uploadAssets);

// Landing Pages Routes
router.route('/:id/landing-pages')
  .get(getLandingPages)
  .post(authorize('admin', 'performance_marketer'), addLandingPage);

router.route('/:id/landing-pages/:landingPageId')
  .get(getLandingPage)
  .put(authorize('admin', 'performance_marketer'), updateLandingPage)
  .delete(authorize('admin', 'performance_marketer'), deleteLandingPage);

// Complete landing page stage
router.post('/:id/landing-pages/complete', authorize('admin', 'performance_marketer'), completeLandingPageStage);

// Strategy Summary Routes
router.get('/:projectId/strategy-summary', getStrategySummary);
router.get('/:projectId/strategy-summary/text', getStrategySummaryText);
router.get('/:projectId/strategy-summary/pdf', getStrategySummaryPdf);
router.get('/:projectId/strategy-summary/context', getTaskContext);

module.exports = router;