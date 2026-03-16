const TrafficStrategy = require('../models/TrafficStrategy');
const Project = require('../models/Project');
const { completeStage, getStageStatus } = require('../middleware/stageGating');
const { hasProjectAccess } = require('../utils/auth');

// Helper to check project access and populate team
const checkProjectAccess = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate('assignedTeam.performanceMarketer', '_id')
    .populate('assignedTeam.contentCreator', '_id')
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

// Default channels
const DEFAULT_CHANNELS = [
  { name: 'meta_ads', label: 'Meta Ads', isSelected: false },
  { name: 'google_ads', label: 'Google Ads', isSelected: false },
  { name: 'linkedin_ads', label: 'LinkedIn Ads', isSelected: false },
  { name: 'youtube_ads', label: 'YouTube Ads', isSelected: false },
  { name: 'podcasts', label: 'Podcasts', isSelected: false },
  { name: 'organic', label: 'Organic', isSelected: false },
  { name: 'radio', label: 'Radio', isSelected: false },
  { name: 'offline_ads', label: 'Offline Ads', isSelected: false }
];

// @desc    Get traffic strategy for a project
// @route   GET /api/traffic-strategy/:projectId
// @access  Private
exports.getTrafficStrategy = async (req, res, next) => {
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
    if (!project.stages.offerEngineering.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Offer Engineering first to access Traffic Strategy'
      });
    }

    let trafficStrategy = await TrafficStrategy.findOne({ projectId });

    if (!trafficStrategy) {
      // Create default traffic strategy with all channels
      trafficStrategy = await TrafficStrategy.create({
        projectId,
        channels: DEFAULT_CHANNELS.map(c => ({
          name: c.name,
          isSelected: false,
          justification: ''
        })),
        createdBy: req.user._id
      });
    }

    // Ensure all channels exist
    const existingChannelNames = trafficStrategy.channels.map(c => c.name);
    const missingChannels = DEFAULT_CHANNELS.filter(
      dc => !existingChannelNames.includes(dc.name)
    );

    if (missingChannels.length > 0) {
      trafficStrategy.channels.push(
        ...missingChannels.map(c => ({
          name: c.name,
          isSelected: false,
          justification: ''
        }))
      );
      await trafficStrategy.save();
    }

    // Format channels with labels
    const channelsWithLabels = trafficStrategy.channels.map(channel => {
      const defaultChannel = DEFAULT_CHANNELS.find(dc => dc.name === channel.name);
      return {
        ...channel.toObject(),
        label: defaultChannel?.label || channel.name
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...trafficStrategy.toObject(),
        channels: channelsWithLabels,
        completionPercentage: trafficStrategy.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update traffic strategy
// @route   POST /api/traffic-strategy/:projectId
// @access  Private
exports.upsertTrafficStrategy = async (req, res, next) => {
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
    if (!project.stages.offerEngineering.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Offer Engineering first to access Traffic Strategy'
      });
    }

    const {
      channels,
      hooks,
      targetAudience,
      totalBudget,
      isCompleted
    } = req.body;

    const trafficData = {
      projectId,
      channels: channels || [],
      hooks: hooks || [],
      targetAudience: targetAudience || {},
      totalBudget: totalBudget || 0,
      createdBy: req.user._id
    };

    // If marking as completed
    if (isCompleted) {
      trafficData.isCompleted = true;
      trafficData.completedAt = new Date();
    }

    const trafficStrategy = await TrafficStrategy.findOneAndUpdate(
      { projectId },
      trafficData,
      { new: true, upsert: true, runValidators: true }
    );

    // If completed, update project stage
    if (isCompleted && !project.stages.trafficStrategy.isCompleted) {
      await completeStage(projectId, 'trafficStrategy');
    }

    // Get updated project
    const updatedProject = await Project.findById(projectId);

    res.status(200).json({
      success: true,
      data: {
        ...trafficStrategy.toObject(),
        completionPercentage: trafficStrategy.calculateCompletion(),
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

// @desc    Add hook to traffic strategy
// @route   POST /api/traffic-strategy/:projectId/hooks
// @access  Private
exports.addHook = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { content, type } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const trafficStrategy = await TrafficStrategy.findOne({ projectId });

    if (!trafficStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Traffic strategy not found'
      });
    }

    trafficStrategy.hooks.push({ content, type: type || 'curiosity' });
    await trafficStrategy.save();

    res.status(200).json({
      success: true,
      data: trafficStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove hook from traffic strategy
// @route   DELETE /api/traffic-strategy/:projectId/hooks/:hookId
// @access  Private
exports.removeHook = async (req, res, next) => {
  try {
    const { projectId, hookId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const trafficStrategy = await TrafficStrategy.findOne({ projectId });

    if (!trafficStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Traffic strategy not found'
      });
    }

    trafficStrategy.hooks = trafficStrategy.hooks.filter(
      hook => hook._id.toString() !== hookId
    );
    await trafficStrategy.save();

    res.status(200).json({
      success: true,
      data: trafficStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle channel selection
// @route   PATCH /api/traffic-strategy/:projectId/channels/:channelName
// @access  Private
exports.toggleChannel = async (req, res, next) => {
  try {
    const { projectId, channelName } = req.params;
    const { isSelected, justification } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const trafficStrategy = await TrafficStrategy.findOne({ projectId });

    if (!trafficStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Traffic strategy not found'
      });
    }

    const channelIndex = trafficStrategy.channels.findIndex(
      c => c.name === channelName
    );

    if (channelIndex === -1) {
      // Add new channel if doesn't exist
      trafficStrategy.channels.push({
        name: channelName,
        isSelected,
        justification: justification || ''
      });
    } else {
      // Update existing channel
      trafficStrategy.channels[channelIndex].isSelected = isSelected;
      if (justification !== undefined) {
        trafficStrategy.channels[channelIndex].justification = justification;
      }
    }

    await trafficStrategy.save();

    res.status(200).json({
      success: true,
      data: trafficStrategy
    });
  } catch (error) {
    next(error);
  }
};