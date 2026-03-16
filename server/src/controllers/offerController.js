const Offer = require('../models/Offer');
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

// @desc    Get offer for a project
// @route   GET /api/offers/:projectId
// @access  Private
exports.getOffer = async (req, res, next) => {
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
    if (!project.stages.marketResearch.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Market Research first to access Offer Engineering'
      });
    }

    let offer = await Offer.findOne({ projectId });

    if (!offer) {
      // Create default offer
      offer = await Offer.create({
        projectId,
        createdBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...offer.toObject(),
        completionPercentage: offer.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update offer
// @route   POST /api/offers/:projectId
// @access  Private
exports.upsertOffer = async (req, res, next) => {
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
    if (!project.stages.marketResearch.isCompleted) {
      return res.status(403).json({
        success: false,
        message: 'Complete Market Research first to access Offer Engineering'
      });
    }

    const {
      functionalValues,
      emotionalValues,
      socialValues,
      economicValues,
      experientialValues,
      bonuses,
      guarantees,
      urgencyTactics,
      pricing,
      isCompleted
    } = req.body;

    const offerData = {
      projectId,
      functionalValues: functionalValues || [],
      emotionalValues: emotionalValues || [],
      socialValues: socialValues || [],
      economicValues: economicValues || [],
      experientialValues: experientialValues || [],
      bonuses: bonuses || [],
      guarantees: guarantees || [],
      urgencyTactics: urgencyTactics || [],
      pricing: pricing || {},
      createdBy: req.user._id
    };

    // If marking as completed
    if (isCompleted) {
      offerData.isCompleted = true;
      offerData.completedAt = new Date();
    }

    const offer = await Offer.findOneAndUpdate(
      { projectId },
      offerData,
      { new: true, upsert: true, runValidators: true }
    );

    // If completed, update project stage
    if (isCompleted && !project.stages.offerEngineering.isCompleted) {
      await completeStage(projectId, 'offerEngineering');
    }

    // Get updated project
    const updatedProject = await Project.findById(projectId);

    res.status(200).json({
      success: true,
      data: {
        ...offer.toObject(),
        completionPercentage: offer.calculateCompletion(),
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

// @desc    Add bonus to offer
// @route   POST /api/offers/:projectId/bonuses
// @access  Private
exports.addBonus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, value } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const offer = await Offer.findOne({ projectId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.bonuses.push({ title, description, value });
    await offer.save();

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove bonus from offer
// @route   DELETE /api/offers/:projectId/bonuses/:bonusId
// @access  Private
exports.removeBonus = async (req, res, next) => {
  try {
    const { projectId, bonusId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const offer = await Offer.findOne({ projectId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.bonuses = offer.bonuses.filter(bonus => bonus._id.toString() !== bonusId);
    await offer.save();

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    next(error);
  }
};