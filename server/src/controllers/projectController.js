const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const { getStageStatus, completeStage } = require('../middleware/stageGating');

// Helper to emit notification (will be set from index.js)
let io = null;
const setIO = (socketIO) => {
  io = socketIO;
};

// Helper to create and emit notification
const createNotification = async ({ recipient, type, title, message, projectId }) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      projectId
    });

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(recipient.toString()).emit('notification', {
        _id: notification._id,
        type,
        title,
        message,
        projectId,
        isRead: false,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    console.log('=== getProjects DEBUG ===');
    console.log('User ID:', req.user?._id?.toString());
    console.log('User role:', req.user?.role);
    console.log('User role type:', typeof req.user?.role);

    // Build query
    let query = {};

    // If not admin, show projects where user is assigned or created by them
    if (req.user.role !== 'admin') {
      console.log('Building non-admin query...');
      query.$or = [
        { createdBy: req.user._id },
        // New array fields
        { 'assignedTeam.performanceMarketers': req.user._id },
        { 'assignedTeam.contentWriters': req.user._id },
        { 'assignedTeam.uiUxDesigners': req.user._id },
        { 'assignedTeam.graphicDesigners': req.user._id },
        { 'assignedTeam.videoEditors': req.user._id },
        { 'assignedTeam.developers': req.user._id },
        { 'assignedTeam.testers': req.user._id },
        // Legacy single fields
        { 'assignedTeam.performanceMarketer': req.user._id },
        { 'assignedTeam.uiUxDesigner': req.user._id },
        { 'assignedTeam.graphicDesigner': req.user._id },
        { 'assignedTeam.developer': req.user._id },
        { 'assignedTeam.tester': req.user._id }
      ];
      console.log('Non-admin user query:', JSON.stringify(query, null, 2));
    } else {
      console.log('Admin user - showing all projects');
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      // New array fields
      .populate('assignedTeam.performanceMarketers', 'name email specialization avatar')
      .populate('assignedTeam.contentWriters', 'name email specialization avatar')
      .populate('assignedTeam.uiUxDesigners', 'name email specialization avatar')
      .populate('assignedTeam.graphicDesigners', 'name email specialization avatar')
      .populate('assignedTeam.videoEditors', 'name email specialization avatar')
      .populate('assignedTeam.developers', 'name email specialization avatar')
      .populate('assignedTeam.testers', 'name email specialization avatar')
      // Legacy single fields
      .populate('assignedTeam.performanceMarketer', 'name email specialization')
      .populate('assignedTeam.contentCreator', 'name email specialization')
      .populate('assignedTeam.contentWriter', 'name email specialization')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization')
      .populate('assignedTeam.graphicDesigner', 'name email specialization')
      .populate('assignedTeam.developer', 'name email specialization')
      .populate('assignedTeam.tester', 'name email specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    console.log('=== QUERY RESULT ===');
    console.log('Query used:', JSON.stringify(query, null, 2));
    console.log(`Found ${projects.length} projects for user ${req.user?._id}`);
    console.log('=== END DEBUG ===');

    // Add stage status to each project
    const projectsWithStatus = projects.map(project => ({
      ...project.toObject(),
      stageStatus: getStageStatus(project)
    }));

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: projectsWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    console.log('=== getProject called ===');
    console.log('Project ID:', req.params.id);
    console.log('Requesting user:', req.user?._id, req.user?.role);

    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      // New array fields
      .populate('assignedTeam.performanceMarketers', 'name email specialization avatar')
      .populate('assignedTeam.contentWriters', 'name email specialization avatar')
      .populate('assignedTeam.uiUxDesigners', 'name email specialization avatar')
      .populate('assignedTeam.graphicDesigners', 'name email specialization avatar')
      .populate('assignedTeam.videoEditors', 'name email specialization avatar')
      .populate('assignedTeam.developers', 'name email specialization avatar')
      .populate('assignedTeam.testers', 'name email specialization avatar')
      // Legacy single fields
      .populate('assignedTeam.performanceMarketer', 'name email specialization avatar')
      .populate('assignedTeam.contentCreator', 'name email specialization avatar')
      .populate('assignedTeam.contentWriter', 'name email specialization avatar')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization avatar')
      .populate('assignedTeam.graphicDesigner', 'name email specialization avatar')
      .populate('assignedTeam.developer', 'name email specialization avatar')
      .populate('assignedTeam.tester', 'name email specialization avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Log assigned team data
    console.log('=== Project Assigned Team ===');
    if (project.assignedTeam) {
      console.log('contentWriters:', project.assignedTeam.contentWriters?.map(m => ({ _id: m?._id?.toString(), name: m?.name })) || 'none');
      console.log('graphicDesigners:', project.assignedTeam.graphicDesigners?.map(m => ({ _id: m?._id?.toString(), name: m?.name })) || 'none');
      console.log('videoEditors:', project.assignedTeam.videoEditors?.map(m => ({ _id: m?._id?.toString(), name: m?.name })) || 'none');
    } else {
      console.log('No assignedTeam');
    }

    // Helper to check if user is in array or legacy field
    const isUserAssigned = (team, field, pluralField, userId) => {
      // Check new array fields
      if (pluralField && team[pluralField] && Array.isArray(team[pluralField])) {
        if (team[pluralField].some(m => m._id?.toString() === userId)) {
          return true;
        }
      }
      // Check legacy single field
      if (team[field] && team[field]._id?.toString() === userId) {
        return true;
      }
      return false;
    };

    // Check access - admin, creator, or assigned team member
    const userId = req.user._id.toString();
    const team = project.assignedTeam || {};
    const isAssigned =
      isUserAssigned(team, 'performanceMarketer', 'performanceMarketers', userId) ||
      isUserAssigned(team, 'contentWriter', 'contentWriters', userId) ||
      isUserAssigned(team, 'uiUxDesigner', 'uiUxDesigners', userId) ||
      isUserAssigned(team, 'graphicDesigner', 'graphicDesigners', userId) ||
      isUserAssigned(team, 'videoEditor', 'videoEditors', userId) ||
      isUserAssigned(team, 'developer', 'developers', userId) ||
      isUserAssigned(team, 'tester', 'testers', userId);

    if (req.user.role !== 'admin' && project.createdBy._id.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    console.log('=== Returning project ===');
    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    console.error('getProject error:', error);
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    const {
      projectName,
      customerName,
      businessName,
      mobile,
      email,
      industry,
      description,
      budget,
      timeline
    } = req.body;

    // Create project with default stages
    const project = await Project.create({
      projectName,
      customerName,
      businessName,
      mobile,
      email,
      industry,
      description,
      budget,
      timeline,
      createdBy: req.user._id,
      stages: {
        onboarding: {
          isCompleted: true,
          completedAt: new Date()
        },
        marketResearch: {
          isCompleted: false
        },
        offerEngineering: {
          isCompleted: false
        },
        trafficStrategy: {
          isCompleted: false
        },
        landingPage: {
          isCompleted: false
        },
        creativeStrategy: {
          isCompleted: false
        }
      }
    });

    // Calculate initial progress
    project.calculateProgress();
    await project.save();

    res.status(201).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    const {
      projectName,
      customerName,
      businessName,
      mobile,
      email,
      industry,
      description,
      budget,
      timeline,
      status
    } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    const fieldsToUpdate = {};
    if (projectName !== undefined) fieldsToUpdate.projectName = projectName;
    if (customerName) fieldsToUpdate.customerName = customerName;
    if (businessName) fieldsToUpdate.businessName = businessName;
    if (mobile) fieldsToUpdate.mobile = mobile;
    if (email) fieldsToUpdate.email = email;
    if (industry !== undefined) fieldsToUpdate.industry = industry;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (budget !== undefined) fieldsToUpdate.budget = budget;
    if (timeline) fieldsToUpdate.timeline = timeline;
    if (status) fieldsToUpdate.status = status;

    project = await Project.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization avatar')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization avatar')
      .populate('assignedTeam.graphicDesigner', 'name email specialization avatar')
      .populate('assignedTeam.developer', 'name email specialization avatar')
      .populate('assignedTeam.tester', 'name email specialization avatar');

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only admin can delete projects
    // Note: authorize('admin') middleware already checks this, but we keep this as a safety check
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete projects'
      });
    }

    // Delete all related data
    // 1. Delete tasks associated with the project
    const Task = require('../models/Task');
    await Task.deleteMany({ projectId: project._id });

    // 2. Delete strategy documents
    const MarketResearch = require('../models/MarketResearch');
    const Offer = require('../models/Offer');
    const TrafficStrategy = require('../models/TrafficStrategy');
    const CreativeStrategy = require('../models/Creative');
    const LandingPage = require('../models/LandingPage');

    await MarketResearch.deleteMany({ projectId: project._id });
    await Offer.deleteMany({ projectId: project._id });
    await TrafficStrategy.deleteMany({ projectId: project._id });
    await CreativeStrategy.deleteMany({ projectId: project._id });
    await LandingPage.deleteMany({ projectId: project._id });

    // 3. Delete notifications related to this project
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ projectId: project._id });

    // 4. Delete the project itself
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign team to project
// @route   PUT /api/projects/:id/assign-team
// @access  Private (Admin only)
exports.assignTeam = async (req, res, next) => {
  try {
    const {
      // New array fields (multi-select)
      performanceMarketers,
      contentWriters,
      uiUxDesigners,
      graphicDesigners,
      videoEditors,
      developers,
      testers,
      // Legacy single fields (for backward compatibility)
      performanceMarketer,
      uiUxDesigner,
      graphicDesigner,
      developer,
      tester
    } = req.body;

    console.log('=== assignTeam called ===');
    console.log('Project ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('contentWriters:', contentWriters);
    console.log('graphicDesigners:', graphicDesigners);
    console.log('videoEditors:', videoEditors);

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update assigned team - support both new array fields and legacy single fields
    project.assignedTeam = {
      // New array fields (plural names)
      performanceMarketers: performanceMarketers || [],
      contentWriters: contentWriters || [],
      uiUxDesigners: uiUxDesigners || [],
      graphicDesigners: graphicDesigners || [],
      videoEditors: videoEditors || [],
      developers: developers || [],
      testers: testers || [],
      // Legacy single fields (for backward compatibility)
      performanceMarketer: performanceMarketer || (performanceMarketers && performanceMarketers[0]) || null,
      contentCreator: req.body.contentCreator || null,
      contentWriter: req.body.contentWriter || (contentWriters && contentWriters[0]) || null,
      uiUxDesigner: uiUxDesigner || (uiUxDesigners && uiUxDesigners[0]) || null,
      graphicDesigner: graphicDesigner || (graphicDesigners && graphicDesigners[0]) || null,
      videoEditor: req.body.videoEditor || (videoEditors && videoEditors[0]) || null,
      developer: developer || (developers && developers[0]) || null,
      tester: tester || (testers && testers[0]) || null
    };

    await project.save();

    console.log('=== Team assignment saved ===');
    console.log('Saved contentWriters:', project.assignedTeam?.contentWriters);
    console.log('Saved graphicDesigners:', project.assignedTeam?.graphicDesigners);
    console.log('Saved videoEditors:', project.assignedTeam?.videoEditors);

    // Collect all unique user IDs for notifications
    const allAssignedIds = new Set();
    const addIds = (ids) => {
      if (ids) {
        (Array.isArray(ids) ? ids : [ids]).forEach(id => {
          if (id) allAssignedIds.add(id.toString());
        });
      }
    };

    addIds(performanceMarketers);
    addIds(contentWriters);
    addIds(uiUxDesigners);
    addIds(graphicDesigners);
    addIds(videoEditors);
    addIds(developers);
    addIds(testers);
    addIds(performanceMarketer);
    addIds(uiUxDesigner);
    addIds(graphicDesigner);
    addIds(developer);
    addIds(tester);

    // Get role labels for notifications
    const roleLabels = {
      performanceMarketer: 'Performance Marketer',
      performanceMarketers: 'Performance Marketer',
      contentWriter: 'Content Writer',
      contentWriters: 'Content Writer',
      uiUxDesigner: 'UI/UX Designer',
      uiUxDesigners: 'UI/UX Designer',
      graphicDesigner: 'Graphic Designer',
      graphicDesigners: 'Graphic Designer',
      videoEditor: 'Video Editor',
      videoEditors: 'Video Editor',
      developer: 'Developer',
      developers: 'Developer',
      tester: 'Tester',
      testers: 'Tester'
    };

    // Send notifications to assigned team members
    for (const userId of allAssignedIds) {
      await createNotification({
        recipient: userId,
        type: 'project_assigned',
        title: 'New Project Assignment',
        message: `You have been assigned to project: ${project.projectName || project.businessName}`,
        projectId: project._id
      });
    }

    // Populate team details (both new and legacy fields)
    await project.populate('assignedTeam.performanceMarketers', 'name email specialization avatar');
    await project.populate('assignedTeam.contentWriters', 'name email specialization avatar');
    await project.populate('assignedTeam.uiUxDesigners', 'name email specialization avatar');
    await project.populate('assignedTeam.graphicDesigners', 'name email specialization avatar');
    await project.populate('assignedTeam.videoEditors', 'name email specialization avatar');
    await project.populate('assignedTeam.developers', 'name email specialization avatar');
    await project.populate('assignedTeam.testers', 'name email specialization avatar');
    // Legacy fields
    await project.populate('assignedTeam.performanceMarketer', 'name email specialization avatar');
    await project.populate('assignedTeam.contentCreator', 'name email specialization avatar');
    await project.populate('assignedTeam.contentWriter', 'name email specialization avatar');
    await project.populate('assignedTeam.uiUxDesigner', 'name email specialization avatar');
    await project.populate('assignedTeam.graphicDesigner', 'name email specialization avatar');
    await project.populate('assignedTeam.developer', 'name email specialization avatar');
    await project.populate('assignedTeam.tester', 'name email specialization avatar');

    res.status(200).json({
      success: true,
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Deactivate project
// @route   PUT /api/projects/:id/activate
// @access  Private (Admin only)
exports.toggleProjectActivation = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.isActive = isActive;
    await project.save();

    // Notify assigned team members when project is activated
    if (isActive) {
      const teamMembers = [
        project.assignedTeam.performanceMarketer,
        project.assignedTeam.uiUxDesigner,
        project.assignedTeam.graphicDesigner,
        project.assignedTeam.developer,
        project.assignedTeam.tester
      ].filter(Boolean);

      for (const memberId of teamMembers) {
        await createNotification({
          recipient: memberId,
          type: 'project_activated',
          title: 'Project Activated',
          message: `Project "${project.projectName || project.businessName}" is now active. You can start working on it.`,
          projectId: project._id
        });
      }
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload brand assets
// @route   POST /api/projects/:id/assets
// @access  Private
exports.uploadAssets = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned =
      project.assignedTeam.performanceMarketer?._id?.toString() === userId ||
      project.assignedTeam.uiUxDesigner?._id?.toString() === userId ||
      project.assignedTeam.graphicDesigner?._id?.toString() === userId ||
      project.assignedTeam.developer?._id?.toString() === userId ||
      project.assignedTeam.tester?._id?.toString() === userId;

    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload assets to this project'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Add uploaded files to project's brand assets
    const newAssets = req.files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      publicId: file.filename,
      uploadedAt: new Date()
    }));

    project.brandAssets = [...project.brandAssets, ...newAssets];
    await project.save();

    res.status(200).json({
      success: true,
      data: project.brandAssets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get projects assigned to current user
// @route   GET /api/projects/assigned
// @access  Private
exports.getAssignedProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    let query = {
      $or: [
        { 'assignedTeam.performanceMarketer': req.user._id },
        { 'assignedTeam.uiUxDesigner': req.user._id },
        { 'assignedTeam.graphicDesigner': req.user._id },
        { 'assignedTeam.developer': req.user._id },
        { 'assignedTeam.tester': req.user._id }
      ]
    };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTeam.performanceMarketer', 'name email specialization')
      .populate('assignedTeam.contentCreator', 'name email specialization')
      .populate('assignedTeam.contentWriter', 'name email specialization')
      .populate('assignedTeam.uiUxDesigner', 'name email specialization')
      .populate('assignedTeam.graphicDesigner', 'name email specialization')
      .populate('assignedTeam.developer', 'name email specialization')
      .populate('assignedTeam.tester', 'name email specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    // Add stage status to each project
    const projectsWithStatus = projects.map(project => ({
      ...project.toObject(),
      stageStatus: getStageStatus(project)
    }));

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: projectsWithStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project progress
// @route   GET /api/projects/:id/progress
// @access  Private
exports.getProjectProgress = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        progress: project.overallProgress,
        currentStage: project.currentStage,
        stages: getStageStatus(project)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/projects/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Build query based on user role
    let query = {};

    if (req.user.role !== 'admin') {
      // For non-admins, show assigned projects
      query.$or = [
        { createdBy: req.user._id },
        { 'assignedTeam.performanceMarketer': req.user._id },
        { 'assignedTeam.uiUxDesigner': req.user._id },
        { 'assignedTeam.graphicDesigner': req.user._id },
        { 'assignedTeam.developer': req.user._id },
        { 'assignedTeam.tester': req.user._id }
      ];
    }

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      recentProjects
    ] = await Promise.all([
      Project.countDocuments(query),
      Project.countDocuments({ ...query, status: 'active', isActive: true }),
      Project.countDocuments({ ...query, status: 'completed' }),
      Project.find(query)
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .populate('assignedTeam.performanceMarketer', 'name')
        .populate('assignedTeam.uiUxDesigner', 'name')
        .populate('assignedTeam.graphicDesigner', 'name')
        .populate('assignedTeam.developer', 'name')
        .populate('assignedTeam.tester', 'name')
    ]);

    // Get projects by stage
    const projectsByStage = await Project.aggregate([
      { $match: query },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        recentProjects,
        projectsByStage
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export setIO for use in other modules
exports.setIO = setIO;
exports.createNotification = createNotification;

// ============================================
// Landing Pages Management (embedded in Project)
// ============================================

// @desc    Add landing page to project
// @route   POST /api/projects/:id/landing-pages
// @access  Private (Admin, Performance Marketer)
exports.addLandingPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, funnelType, platform, hook, angle, cta, offer, messaging, leadCaptureMethod, headline, subheadline } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned = project.assignedTeam.performanceMarketer?._id?.toString() === userId;
    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add landing pages to this project'
      });
    }

    // Create new landing page object
    const newLandingPage = {
      name: name || `Landing Page ${project.landingPages.length + 1}`,
      funnelType: funnelType || 'video_sales_letter',
      platform: platform || 'facebook',
      hook: hook || '',
      angle: angle || '',
      cta: cta || '',
      offer: offer || '',
      messaging: messaging || '',
      leadCaptureMethod: leadCaptureMethod || 'form',
      headline: headline || '',
      subheadline: subheadline || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    project.landingPages.push(newLandingPage);
    await project.save();

    res.status(201).json({
      success: true,
      data: project.landingPages[project.landingPages.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all landing pages for a project
// @route   GET /api/projects/:id/landing-pages
// @access  Private
exports.getLandingPages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned =
      project.assignedTeam.performanceMarketer?._id?.toString() === userId ||
      project.assignedTeam.uiUxDesigner?._id?.toString() === userId ||
      project.assignedTeam.graphicDesigner?._id?.toString() === userId ||
      project.assignedTeam.developer?._id?.toString() === userId ||
      project.assignedTeam.tester?._id?.toString() === userId;

    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      count: project.landingPages.length,
      data: project.landingPages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single landing page
// @route   GET /api/projects/:id/landing-pages/:landingPageId
// @access  Private
exports.getLandingPage = async (req, res, next) => {
  try {
    const { id, landingPageId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const landingPage = project.landingPages.id(landingPageId);
    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    res.status(200).json({
      success: true,
      data: landingPage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update landing page
// @route   PUT /api/projects/:id/landing-pages/:landingPageId
// @access  Private (Admin, Performance Marketer)
exports.updateLandingPage = async (req, res, next) => {
  try {
    const { id, landingPageId } = req.params;
    const { name, funnelType, platform, hook, angle, cta, offer, messaging, leadCaptureMethod, headline, subheadline } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned = project.assignedTeam.performanceMarketer?._id?.toString() === userId;
    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update landing pages in this project'
      });
    }

    const landingPage = project.landingPages.id(landingPageId);
    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    // Update fields
    if (name !== undefined) landingPage.name = name;
    if (funnelType !== undefined) landingPage.funnelType = funnelType;
    if (platform !== undefined) landingPage.platform = platform;
    if (hook !== undefined) landingPage.hook = hook;
    if (angle !== undefined) landingPage.angle = angle;
    if (cta !== undefined) landingPage.cta = cta;
    if (offer !== undefined) landingPage.offer = offer;
    if (messaging !== undefined) landingPage.messaging = messaging;
    if (leadCaptureMethod !== undefined) landingPage.leadCaptureMethod = leadCaptureMethod;
    if (headline !== undefined) landingPage.headline = headline;
    if (subheadline !== undefined) landingPage.subheadline = subheadline;
    landingPage.updatedAt = new Date();

    await project.save();

    res.status(200).json({
      success: true,
      data: landingPage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete landing page
// @route   DELETE /api/projects/:id/landing-pages/:landingPageId
// @access  Private (Admin, Performance Marketer)
exports.deleteLandingPage = async (req, res, next) => {
  try {
    const { id, landingPageId } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned = project.assignedTeam.performanceMarketer?._id?.toString() === userId;
    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete landing pages in this project'
      });
    }

    const landingPage = project.landingPages.id(landingPageId);
    if (!landingPage) {
      return res.status(404).json({
        success: false,
        message: 'Landing page not found'
      });
    }

    // Remove landing page
    project.landingPages.pull(landingPageId);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Landing page deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete landing page stage
// @route   POST /api/projects/:id/landing-pages/complete
// @access  Private (Admin, Performance Marketer)
exports.completeLandingPageStage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('assignedTeam.uiUxDesigner', '_id name email')
      .populate('assignedTeam.developer', '_id name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAssigned = project.assignedTeam.performanceMarketer?._id?.toString() === userId;
    if (req.user.role !== 'admin' && project.createdBy.toString() !== userId && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this stage'
      });
    }

    // Landing pages are embedded in the Project document
    const landingPages = project.landingPages || [];

    // Check if there are landing pages
    if (landingPages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add at least one landing page before completing this stage'
      });
    }

    // Check if tasks already exist for this project's landing pages
    const existingTasks = await Task.find({
      projectId: id,
      taskType: { $in: ['landing_page_design', 'landing_page_development'] }
    });
    const existingLandingPageIds = existingTasks.map(t => t.landingPageId?.toString()).filter(Boolean);

    // Get strategy context for task generation
    const MarketResearch = require('../models/MarketResearch');
    const Offer = require('../models/Offer');
    const TrafficStrategy = require('../models/TrafficStrategy');

    const [marketResearch, offer, trafficStrategy] = await Promise.all([
      MarketResearch.findOne({ projectId: id }),
      Offer.findOne({ projectId: id }),
      TrafficStrategy.findOne({ projectId: id })
    ]);

    const tasksCreated = [];

    // Generate tasks for each landing page that doesn't have tasks yet
    for (const landingPage of landingPages) {
      // Skip if tasks already exist for this landing page
      if (existingLandingPageIds.includes(landingPage._id.toString())) {
        console.log(`Skipping landing page ${landingPage.name} - tasks already exist`);
        continue;
      }

      // Build strategy context
      const strategyContext = {
        businessName: project.businessName || project.customerName,
        industry: project.industry || '',
        platform: landingPage.platform,
        hook: landingPage.hook,
        creativeAngle: landingPage.angle,
        headline: landingPage.headline,
        cta: landingPage.cta,
        targetAudience: '',
        painPoints: marketResearch?.painPoints || [],
        desires: marketResearch?.desires || [],
        offer: offer?.bonuses?.map(b => b.title).join(', ') || ''
      };

      const contextLink = `${process.env.CLIENT_URL}/projects/${id}/strategy-summary`;

      // Create design task for UI/UX Designer
      const designTask = {
        projectId: id,
        landingPageId: landingPage._id,
        taskTitle: `Design: ${landingPage.name || 'Landing Page'}`,
        taskType: 'landing_page_design',
        assetType: 'landing_page_design',
        assignedRole: 'ui_ux_designer',
        assignedTo: project.assignedTeam?.uiUxDesigner?._id || null,
        assignedBy: userId,
        createdBy: userId,
        status: 'design_pending',
        strategyContext,
        contextLink
      };

      // Create development task for Developer
      const devTask = {
        projectId: id,
        landingPageId: landingPage._id,
        taskTitle: `Develop: ${landingPage.name || 'Landing Page'}`,
        taskType: 'landing_page_development',
        assetType: 'landing_page_page',
        assignedRole: 'developer',
        assignedTo: project.assignedTeam?.developer?._id || null,
        assignedBy: userId,
        createdBy: userId,
        status: 'development_pending',
        strategyContext,
        contextLink
      };

      const createdTasks = await Task.insertMany([designTask, devTask]);

      // Send notifications for assigned users
      for (const task of createdTasks) {
        if (task.assignedTo) {
          await Notification.create({
            recipient: task.assignedTo,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned a new task: "${task.taskTitle}" for landing page "${landingPage.name}"`,
            projectId: id,
            taskId: task._id
          });
        }
      }

      tasksCreated.push(...createdTasks);
    }

    console.log(`Created ${tasksCreated.length} landing page tasks for project ${project.businessName || project.customerName}`);

    // Mark the landing page stage as complete
    project.stages.landingPage.isCompleted = true;
    project.stages.landingPage.completedAt = new Date();

    // Calculate progress
    project.calculateProgress();
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Landing page stage completed successfully',
      data: {
        ...project.toObject(),
        stageStatus: getStageStatus(project),
        tasksCreated: tasksCreated.length
      }
    });
  } catch (error) {
    next(error);
  }
};