const Project = require('../models/Project');
const MarketResearch = require('../models/MarketResearch');
const Offer = require('../models/Offer');
const TrafficStrategy = require('../models/TrafficStrategy');
const LandingPage = require('../models/LandingPage');
const Creative = require('../models/Creative');
const Notification = require('../models/Notification');
const { getStageStatus } = require('../middleware/stageGating');
const { hasProjectAccess } = require('../utils/auth');

// @desc    Get complete strategy for a project (all stages data)
// @route   GET /api/strategy/:projectId
// @access  Private (Admin or assigned team members)
exports.getCompleteStrategy = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization')
      .populate('assignedTeam.graphicDesigner', 'name email specialization')
      .populate('assignedTeam.developer', 'name email specialization')
      .populate('assignedTeam.tester', 'name email specialization')
      .populate('reviewedBy', 'name email');

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

    // Fetch all stage data in parallel
    const [marketResearch, offer, trafficStrategy, landingPage, creative] = await Promise.all([
      MarketResearch.findOne({ projectId }),
      Offer.findOne({ projectId }),
      TrafficStrategy.findOne({ projectId }),
      LandingPage.findOne({ projectId }),
      Creative.findOne({ projectId })
    ]);

    // Build complete strategy response
    const strategy = {
      project: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      },
      stages: {
        onboarding: {
          isCompleted: project.stages.onboarding.isCompleted,
          completedAt: project.stages.onboarding.completedAt
        },
        marketResearch: marketResearch ? {
          data: marketResearch,
          isCompleted: project.stages.marketResearch.isCompleted,
          completedAt: project.stages.marketResearch.completedAt
        } : null,
        offerEngineering: offer ? {
          data: offer,
          isCompleted: project.stages.offerEngineering.isCompleted,
          completedAt: project.stages.offerEngineering.completedAt
        } : null,
        trafficStrategy: trafficStrategy ? {
          data: trafficStrategy,
          isCompleted: project.stages.trafficStrategy.isCompleted,
          completedAt: project.stages.trafficStrategy.completedAt
        } : null,
        landingPage: landingPage ? {
          data: landingPage,
          isCompleted: project.stages.landingPage.isCompleted,
          completedAt: project.stages.landingPage.completedAt
        } : null,
        creativeStrategy: creative ? {
          data: creative,
          isCompleted: project.stages.creativeStrategy.isCompleted,
          completedAt: project.stages.creativeStrategy.completedAt
        } : null
      },
      strategyStatus: project.strategyStatus,
      strategyCompletedAt: project.strategyCompletedAt,
      strategyReviewedAt: project.strategyReviewedAt,
      reviewedBy: project.reviewedBy
    };

    res.status(200).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark strategy as reviewed by admin
// @route   PUT /api/strategy/:projectId/review
// @access  Private (Admin only)
exports.markStrategyReviewed = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { notes } = req.body;

    // Only admin can mark strategy as reviewed
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can mark strategy as reviewed'
      });
    }

    const project = await Project.findById(projectId)
      .populate('assignedTeam.performanceMarketer', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.strategyStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Strategy must be completed before review'
      });
    }

    project.strategyStatus = 'reviewed';
    project.strategyReviewedAt = new Date();
    project.reviewedBy = req.user._id;

    await project.save();

    // Notify the performance marketer
    if (project.assignedTeam.performanceMarketer) {
      await Notification.create({
        recipient: project.assignedTeam.performanceMarketer._id,
        type: 'strategy_reviewed',
        title: 'Strategy Reviewed',
        message: `Your strategy for project "${project.projectName || project.businessName}" has been reviewed by admin.`,
        projectId: project._id
      });
    }

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project.toObject(),
          stageStatus: getStageStatus(project)
        },
        message: 'Strategy marked as reviewed'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all completed strategies awaiting review (Admin only)
// @route   GET /api/strategy/pending-review
// @access  Private (Admin only)
exports.getPendingReviewStrategies = async (req, res, next) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view pending reviews'
      });
    }

    const projects = await Project.find({ strategyStatus: 'completed' })
      .populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email')
      .sort({ strategyCompletedAt: -1 });

    const strategies = projects.map(project => ({
      project: {
        _id: project._id,
        projectName: project.projectName,
        businessName: project.businessName,
        customerName: project.customerName,
        industry: project.industry,
        overallProgress: project.overallProgress,
        stageStatus: getStageStatus(project),
        strategyCompletedAt: project.strategyCompletedAt
      },
      completedBy: project.assignedTeam.performanceMarketer,
      createdBy: project.createdBy
    }));

    res.status(200).json({
      success: true,
      count: strategies.length,
      data: strategies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get strategy statistics (Admin only)
// @route   GET /api/strategy/stats
// @access  Private (Admin only)
exports.getStrategyStats = async (req, res, next) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view strategy stats'
      });
    }

    const [inProgress, completed, reviewed] = await Promise.all([
      Project.countDocuments({ strategyStatus: 'in_progress' }),
      Project.countDocuments({ strategyStatus: 'completed' }),
      Project.countDocuments({ strategyStatus: 'reviewed' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        inProgress,
        completed,
        reviewed,
        total: inProgress + completed + reviewed
      }
    });
  } catch (error) {
    next(error);
  }
};