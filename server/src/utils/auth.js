const Project = require('../models/Project');

/**
 * Check if a user has access to a project
 * @param {Object} project - The project document (should have assignedTeam populated)
 * @param {Object} user - The user object from req.user
 * @returns {boolean} - True if user has access
 */
exports.hasProjectAccess = (project, user) => {
  // Admin always has access
  if (user.role === 'admin') {
    return true;
  }

  const userId = user._id.toString();

  // Check if user is the creator
  if (project.createdBy && project.createdBy.toString() === userId) {
    return true;
  }

  // Check if user is assigned to the team
  const isAssigned =
    project.assignedTeam?.performanceMarketer?._id?.toString() === userId ||
    project.assignedTeam?.contentCreator?._id?.toString() === userId ||
    project.assignedTeam?.uiUxDesigner?._id?.toString() === userId ||
    project.assignedTeam?.graphicDesigner?._id?.toString() === userId ||
    project.assignedTeam?.developer?._id?.toString() === userId ||
    project.assignedTeam?.tester?._id?.toString() === userId;

  return isAssigned;
};

/**
 * Middleware to check project access
 * @param {string} projectIdParam - The request param name for project ID (default: 'projectId')
 * @returns {Function} Express middleware
 */
exports.checkProjectAccess = (projectIdParam = 'projectId') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params[projectIdParam];

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      const project = await Project.findById(projectId)
        .populate('assignedTeam.performanceMarketer', '_id')
        .populate('assignedTeam.contentCreator', '_id')
        .populate('assignedTeam.uiUxDesigner', '_id')
        .populate('assignedTeam.graphicDesigner', '_id')
        .populate('assignedTeam.developer', '_id')
        .populate('assignedTeam.tester', '_id');

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      if (!exports.hasProjectAccess(project, req.user)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this project'
        });
      }

      req.project = project;
      next();
    } catch (error) {
      next(error);
    }
  };
};