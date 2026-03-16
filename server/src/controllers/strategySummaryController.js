const Project = require('../models/Project');
const { getStrategySummary, generatePdfContent, generateTextSummary, generateTaskContext } = require('../services/strategySummaryService');
const { hasProjectAccess } = require('../utils/auth');

// @desc    Get strategy summary for a project
// @route   GET /api/projects/:projectId/strategy-summary
// @access  Private (Project team members)
exports.getStrategySummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('assignedTeam.performanceMarketer', 'name email')
      .populate('assignedTeam.uiUxDesigner', 'name email')
      .populate('assignedTeam.graphicDesigner', 'name email')
      .populate('assignedTeam.developer', 'name email')
      .populate('assignedTeam.tester', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    const summary = await getStrategySummary(projectId);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get strategy summary as formatted text
// @route   GET /api/projects/:projectId/strategy-summary/text
// @access  Private (Project team members)
exports.getStrategySummaryText = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    const summary = await getStrategySummary(projectId);
    const textSummary = generateTextSummary(summary);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="strategy-summary-${projectId}.txt"`);
    res.send(textSummary);
  } catch (error) {
    next(error);
  }
};

// @desc    Get strategy summary as PDF (JSON structure for frontend to render)
// @route   GET /api/projects/:projectId/strategy-summary/pdf
// @access  Private (Project team members)
exports.getStrategySummaryPdf = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    const summary = await getStrategySummary(projectId);
    const pdfContent = generatePdfContent(summary);

    // Return structured data for frontend to generate PDF or display
    res.status(200).json({
      success: true,
      data: {
        project: summary.project,
        sections: pdfContent,
        generatedAt: new Date(),
        downloadUrl: `/api/projects/${projectId}/strategy-summary/text`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get condensed task context for AI prompts
// @route   GET /api/projects/:projectId/strategy-summary/context
// @access  Private (Project team members)
exports.getTaskContext = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    const summary = await getStrategySummary(projectId);
    const context = generateTaskContext(summary);

    res.status(200).json({
      success: true,
      data: context
    });
  } catch (error) {
    next(error);
  }
};