const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamByRole,
  debugTestDb
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/logout', protect, logout);

// Team management routes (Admin only)
router.get('/team', protect, authorize('admin'), getTeamMembers);
router.get('/team/by-role', protect, getTeamByRole);
router.post('/create-user', protect, authorize('admin'), createTeamMember);
router.put('/users/:id', protect, authorize('admin'), updateTeamMember);
router.delete('/users/:id', protect, authorize('admin'), deleteTeamMember);

// Debug routes (Admin only - remove in production)
router.get('/debug/test-db', protect, authorize('admin'), debugTestDb);

module.exports = router;