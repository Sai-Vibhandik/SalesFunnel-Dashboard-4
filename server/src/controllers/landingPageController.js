const LandingPage = require('../models/LandingPage');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { completeStage, getStageStatus } = require('../middleware/stageGating');
const { hasProjectAccess } = require('../utils/auth');

const checkProjectAccess = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate('assignedTeam.performanceMarketer', '_id')
    .populate('assignedTeam.uiUxDesigner', '_id')
    .populate('assignedTeam.graphicDesigner', '_id')
    .populate('assignedTeam.developer', '_id')
    .populate('assignedTeam.tester', '_id');

  if (!project) {
    return { project: null, error: { status: 404, message: 'Project not found' } };
  }

  if (!hasProjectAccess(project, user)) {
    return { project: null, error: { status: 403, message: 'Not authorized to access this project' } };
  }

  return { project, error: null };
};

// @desc    Get all landing pages for a project
// @route   GET /api/landing-pages/:projectId
// @access  Private
exports.getLandingPages = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    const landingPages = await LandingPage.find({ projectId, isActive: true })
      .sort({ order: 1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: landingPages.length,
      data: landingPages.map(lp => ({
        ...lp.toObject(),
        completionPercentage: lp.calculateCompletion()
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single landing page
// @route   GET /api/landing-pages/:projectId/:landingPageId
// @access  Private
exports.getLandingPage = async (req, res, next) => {
  try {
    const { projectId, landingPageId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    const landingPage = await LandingPage.findOne({
      _id: landingPageId,
      projectId,
      isActive: true
    }).populate('createdBy', 'name email');

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...landingPage.toObject(),
        completionPercentage: landingPage.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new landing page
// @route   POST /api/landing-pages/:projectId
// @access  Private
exports.createLandingPage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      name, type, funnelType, hook, angle, platform, cta, offer, messaging,
      leadCaptureMethod, leadCapture, nurturing, headline, subheadline,
      designPreferences, seoSettings
    } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    // Get count for auto-ordering
    const count = await LandingPage.countDocuments({ projectId, isActive: true });

    const landingPage = await LandingPage.create({
      projectId,
      name: name || `Landing Page ${count + 1}`,
      order: count,
      // Support both field names for backward compatibility
      funnelType: funnelType || type || 'video_sales_letter',
      type: type || funnelType || 'video_sales_letter',
      hook: hook || '',
      angle: angle || '',
      platform: platform || 'facebook',
      cta: cta || '',
      ctaText: cta || '', // Sync ctaText for backward compatibility
      offer: offer || '',
      messaging: messaging || '',
      leadCaptureMethod: leadCaptureMethod || 'form',
      leadCapture: leadCapture || { method: leadCaptureMethod || 'form' },
      nurturing: nurturing || [],
      headline: headline || '',
      subheadline: subheadline || '',
      designPreferences: designPreferences || {},
      seoSettings: seoSettings || {},
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: {
        ...landingPage.toObject(),
        completionPercentage: landingPage.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update landing page
// @route   PUT /api/landing-pages/:projectId/:landingPageId
// @access  Private
exports.updateLandingPage = async (req, res, next) => {
  try {
    const { projectId, landingPageId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    const landingPage = await LandingPage.findOne({
      _id: landingPageId,
      projectId,
      isActive: true
    });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    // Update fields
    const updatableFields = [
      'name', 'type', 'funnelType', 'hook', 'angle', 'platform', 'cta', 'offer', 'messaging',
      'leadCaptureMethod', 'leadCapture', 'nurturing', 'headline', 'subheadline',
      'designPreferences', 'seoSettings'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        landingPage[field] = req.body[field];
      }
    });

    // Sync ctaText for backward compatibility
    if (req.body.cta !== undefined) {
      landingPage.ctaText = req.body.cta;
    }

    // Sync funnelType/type for backward compatibility
    if (req.body.funnelType !== undefined) {
      landingPage.type = req.body.funnelType;
    }
    if (req.body.type !== undefined) {
      landingPage.funnelType = req.body.type;
    }

    await landingPage.save();

    res.status(200).json({
      success: true,
      data: {
        ...landingPage.toObject(),
        completionPercentage: landingPage.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete landing page (soft delete)
// @route   DELETE /api/landing-pages/:projectId/:landingPageId
// @access  Private
exports.deleteLandingPage = async (req, res, next) => {
  try {
    const { projectId, landingPageId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const landingPage = await LandingPage.findOne({
      _id: landingPageId,
      projectId,
      isActive: true
    });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    // Soft delete
    landingPage.isActive = false;
    await landingPage.save();

    // Re-order remaining landing pages
    const remainingLandingPages = await LandingPage.find({
      projectId,
      isActive: true,
      order: { $gt: landingPage.order }
    }).sort({ order: 1 });

    for (const lp of remainingLandingPages) {
      lp.order = lp.order - 1;
      await lp.save();
    }

    res.status(200).json({
      success: true,
      message: 'Landing page deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete landing page and generate tasks
// @route   POST /api/landing-pages/:projectId/:landingPageId/complete
// @access  Private
exports.completeLandingPage = async (req, res, next) => {
  try {
    const { projectId, landingPageId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access
    if (!project.stages.trafficStrategy.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Traffic Strategy first to access Landing Page Strategy'
      });
    }

    const landingPage = await LandingPage.findOne({
      _id: landingPageId,
      projectId,
      isActive: true
    });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    // Mark as completed
    landingPage.isCompleted = true;
    landingPage.completedAt = new Date();
    await landingPage.save();

    // Check if this is the first completed landing page - if so, complete the stage
    const completedCount = await LandingPage.countDocuments({
      projectId,
      isCompleted: true,
      isActive: true
    });

    // If this is the first completed landing page, mark the stage as complete
    if (completedCount === 1 && !project.stages.landingPage.isCompleted) {
      await completeStage(projectId, 'landingPage');
    }

    // Generate tasks for this landing page
    const tasksCreated = await generateLandingPageTasks(project, landingPage, req.user._id);

    // Get updated project
    const updatedProject = await Project.findById(projectId);

    res.status(200).json({
      success: true,
      message: 'Landing page completed successfully',
      data: {
        ...landingPage.toObject(),
        completionPercentage: landingPage.calculateCompletion(),
        tasksCreated: tasksCreated.length,
        projectProgress: {
          overallProgress: updatedProject.overallProgress,
          currentStage: updatedProject.currentStage,
          stages: getStageStatus(updatedProject)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate tasks for a landing page
const generateLandingPageTasks = async (project, landingPage, userId) => {
  const tasks = [];

  // Get strategy context for task generation
  const MarketResearch = require('../models/MarketResearch');
  const Offer = require('../models/Offer');
  const TrafficStrategy = require('../models/TrafficStrategy');

  const [marketResearch, offer, trafficStrategy] = await Promise.all([
    MarketResearch.findOne({ projectId: project._id }),
    Offer.findOne({ projectId: project._id }),
    TrafficStrategy.findOne({ projectId: project._id })
  ]);

  // Build strategy context
  const strategyContext = {
    businessName: project.businessName || project.customerName,
    industry: '',
    platform: landingPage.platform,
    hook: landingPage.hook,
    creativeAngle: landingPage.angle,
    headline: landingPage.headline,
    cta: landingPage.ctaText,
    targetAudience: '',
    painPoints: marketResearch?.painPoints || [],
    desires: marketResearch?.desires || [],
    offer: offer?.bonuses?.map(b => b.title).join(', ') || ''
  };

  // Create design task
  const designTask = {
    projectId: project._id,
    landingPageId: landingPage._id,
    taskTitle: `Design: ${landingPage.name}`,
    taskType: 'landing_page_design',
    assetType: 'landing_page_design',
    assignedRole: 'ui_ux_designer',
    assignedTo: project.assignedTeam?.uiUxDesigner || null,
    assignedBy: userId,
    createdBy: userId,
    status: 'design_pending',
    strategyContext,
    contextLink: `${process.env.CLIENT_URL}/landing-page-strategy?projectId=${project._id}&landingPageId=${landingPage._id}`
  };

  // Create development task
  const devTask = {
    projectId: project._id,
    landingPageId: landingPage._id,
    taskTitle: `Develop: ${landingPage.name}`,
    taskType: 'landing_page_development',
    assetType: 'landing_page_page',
    assignedRole: 'developer',
    assignedTo: project.assignedTeam?.developer || null,
    assignedBy: userId,
    createdBy: userId,
    status: 'development_pending',
    strategyContext,
    contextLink: `${process.env.CLIENT_URL}/landing-page-strategy?projectId=${project._id}&landingPageId=${landingPage._id}`
  };

  tasks.push(designTask, devTask);

  const createdTasks = await Task.insertMany(tasks);

  // Send notifications if assignees exist
  const Notification = require('../models/Notification');
  for (const task of createdTasks) {
    if (task.assignedTo) {
      await Notification.create({
        recipient: task.assignedTo,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.taskTitle}" for landing page "${landingPage.name}"`,
        projectId: project._id,
        taskId: task._id
      });
    }
  }

  return createdTasks;
};

// @desc    Add nurturing method
// @route   POST /api/landing-pages/:projectId/:landingPageId/nurturing
// @access  Private
exports.addNurturing = async (req, res, next) => {
  try {
    const { projectId, landingPageId } = req.params;
    const { method, frequency } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const landingPage = await LandingPage.findOne({
      _id: landingPageId,
      projectId,
      isActive: true
    });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    landingPage.nurturing.push({ method, frequency });
    await landingPage.save();

    res.status(200).json({
      success: true,
      data: landingPage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove nurturing method
// @route   DELETE /api/landing-pages/:projectId/:landingPageId/nurturing/:nurturingId
// @access  Private
exports.removeNurturing = async (req, res, next) => {
  try {
    const { projectId, landingPageId, nurturingId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const landingPage = await LandingPage.findOne({
      _id: landingPageId,
      projectId,
      isActive: true
    });

    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    landingPage.nurturing = landingPage.nurturing.filter(
      n => n._id.toString() !== nurturingId
    );
    await landingPage.save();

    res.status(200).json({
      success: true,
      data: landingPage
    });
  } catch (error) {
    next(error);
  }
};