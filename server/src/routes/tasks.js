const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { handleUpload, uploadTaskFiles } = require('../middleware/upload');
const {
  getMyTasks,
  getAllTasks,
  getTask,
  getProjectTasks,
  getProjectCompletedAssets,
  createTask,
  updateTask,
  assignTask,
  testerReview,
  marketerReview,
  uploadFiles,
  getPendingReviewTasks,
  getPendingMarketerApproval,
  getApprovedAssets,
  generateTasks,
  updateTaskContent,
  getTeamMembers,
  getTasksByRole,
  getMyRoleTasks,
  getMyCreativeTasks
} = require('../controllers/taskController');

// All routes require authentication
router.use(protect);

// ===========================================
// Task Management Routes
// ===========================================

// Get tasks for current user
router.get('/my-tasks', getMyTasks);

// Get tasks for current user by their role
router.get('/my-role-tasks', getMyRoleTasks);

// Get creative tasks for current user from CreativeStrategy
router.get('/my-creative-tasks', getMyCreativeTasks);

// Get team members for assignment
router.get('/team-members', getTeamMembers);

// Get tasks by role (for dashboard)
router.get('/by-role/:role', getTasksByRole);

// Get tasks pending tester review (Testers/Admin only)
router.get('/pending-review', authorize('tester', 'admin'), getPendingReviewTasks);

// Get approved assets (Testers/Admin/Performance Marketer)
router.get('/approved-assets', authorize('tester', 'admin', 'performance_marketer'), getApprovedAssets);

// Get tasks pending marketer approval (Performance Marketers/Admin only)
router.get('/pending-marketer-approval', authorize('performance_marketer', 'admin'), getPendingMarketerApproval);

// Get all tasks (Admin/Performance Marketer only)
router.get('/', authorize('admin', 'performance_marketer'), getAllTasks);

// Get tasks for a specific project
router.get('/project/:projectId', getProjectTasks);

// Get completed assets for a specific project
router.get('/project/:projectId/completed', getProjectCompletedAssets);

// Generate tasks from strategy (Admin only)
router.post('/generate/:projectId', authorize('admin'), generateTasks);

// Create new task (Admin/Performance Marketer only)
router.post('/', authorize('admin', 'performance_marketer'), createTask);

// Get single task
router.get('/:taskId', getTask);

// Update task (Assigned user only)
router.put('/:taskId', updateTask);

// Update task status
router.put('/:taskId/status', updateTask);

// Assign task to user (Admin/Performance Marketer only)
router.put('/:taskId/assign', authorize('admin', 'performance_marketer'), assignTask);

// Tester review - approve/reject (Tester/Admin only)
router.put('/:taskId/tester-review', authorize('tester', 'admin'), testerReview);

// Marketer review - approve/reject (Performance Marketer/Admin only)
router.put('/:taskId/marketer-review', authorize('performance_marketer', 'admin'), marketerReview);

// Upload files to task
router.post('/:taskId/files', handleUpload(uploadTaskFiles), uploadFiles);

// Update task content
router.put('/:taskId/content', updateTaskContent);

module.exports = router;