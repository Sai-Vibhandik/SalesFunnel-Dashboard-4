const CreativeStrategy = require('../models/Creative');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { completeStage, getStageStatus } = require('../middleware/stageGating');
const { hasProjectAccess } = require('../utils/auth');
const { generateTasksFromStrategy } = require('../services/taskGenerationService');

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

// @desc    Get creative strategy for a project
// @route   GET /api/creatives/:projectId
// @access  Private
exports.getCreativeStrategy = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access - allow if landing pages exist or stage is marked complete
    const hasLandingPages = project.landingPages && project.landingPages.length > 0;
    if (!project.stages.landingPage.isCompleted && !hasLandingPages) {
      return res.status(403).json({
        success: false,
        message: 'Add at least one landing page to access Creative Strategy'
      });
    }

    let creativeStrategy = await CreativeStrategy.findOne({ projectId })
      .populate('stages.creatives.assignedDesigner', 'name email')
      .populate('stages.creatives.assignedContentWriter', 'name email')
      .populate('creativePlan.assignedTeamMembers', 'name email')
      .populate('creativePlan.contentWriter', 'name email');

    if (!creativeStrategy) {
      // Create default creative strategy
      creativeStrategy = await CreativeStrategy.create({
        projectId,
        stages: [
          { stage: 'awareness', creatives: [], totalCreatives: 0 },
          { stage: 'consideration', creatives: [], totalCreatives: 0 },
          { stage: 'conversion', creatives: [], totalCreatives: 0 }
        ],
        createdBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...creativeStrategy.toObject(),
        completionPercentage: creativeStrategy.calculateCompletion()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update creative strategy
// @route   POST /api/creatives/:projectId
// @access  Private
exports.upsertCreativeStrategy = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    console.log('=== UPSERT CREATIVE STRATEGY ===');
    console.log('Project ID:', projectId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    // Check stage access - allow if landing pages exist or stage is marked complete
    const hasLandingPages = project.landingPages && project.landingPages.length > 0;
    if (!project.stages.landingPage.isCompleted && !hasLandingPages) {
      return res.status(403).json({
        success: false,
        message: 'Add at least one landing page to access Creative Strategy'
      });
    }

    const {
      stages,
      creativeBrief,
      brandGuidelines,
      adTypes,
      creativePlan,
      creativeCategories,
      additionalNotes,
      isCompleted
    } = req.body;

    // Debug log incoming creative plan data
    console.log('\n=== INCOMING CREATIVE PLAN DATA ===');
    if (creativePlan && creativePlan.length > 0) {
      creativePlan.forEach((item, idx) => {
        console.log(`Item ${idx + 1}:`, {
          name: item.name,
          creativeType: item.creativeType,
          subType: item.subType,
          objective: item.objective,
          assignedRole: item.assignedRole,
          assignedTeamMembers: item.assignedTeamMembers,
          contentWriter: item.contentWriter,
          platforms: item.platforms,
          screenSizes: item.screenSizes,
          notes: item.notes?.substring(0, 50) + '...'
        });
      });
    } else {
      console.log('No creative plan items received');
    }

    const creativeData = {
      projectId,
      stages: stages || [
        { stage: 'awareness', creatives: [], totalCreatives: 0 },
        { stage: 'consideration', creatives: [], totalCreatives: 0 },
        { stage: 'conversion', creatives: [], totalCreatives: 0 }
      ],
      creativeBrief: creativeBrief || '',
      brandGuidelines: brandGuidelines || {},
      adTypes: adTypes || [],
      creativePlan: creativePlan || [],
      creativeCategories: creativeCategories || [],
      additionalNotes: additionalNotes || '',
      createdBy: req.user._id
    };

    // If marking as completed
    if (isCompleted) {
      creativeData.isCompleted = true;
      creativeData.completedAt = new Date();
    }

    console.log('Creative data to save:', JSON.stringify(creativeData, null, 2));

    const creativeStrategy = await CreativeStrategy.findOneAndUpdate(
      { projectId },
      creativeData,
      { new: true, upsert: true, runValidators: true }
    );

    // Calculate total creatives
    creativeStrategy.calculateTotal();
    await creativeStrategy.save();

    console.log('Saved creative strategy creativePlan items:', creativeStrategy.creativePlan?.map(item => ({
      name: item.name,
      creativeType: item.creativeType,
      subType: item.subType,
      assignedRole: item.assignedRole,
      assignedTeamMembers: item.assignedTeamMembers,
      contentWriter: item.contentWriter,
      platforms: item.platforms,
      screenSizes: item.screenSizes
    })));

    // If completed, update project stage and generate tasks
    if (isCompleted) {
      // Update stage completion
      if (!project.stages.creativeStrategy.isCompleted) {
        await completeStage(projectId, 'creativeStrategy', req.user._id);
      }

      // Generate tasks from creative strategy
      // This will check for existing tasks and only create new ones
      try {
        console.log('\n========================================');
        console.log('=== GENERATING TASKS FROM CREATIVE STRATEGY ===');
        console.log('========================================');
        console.log('Project ID:', projectId);
        console.log('Business Name:', project.businessName);

        // Log project team assignments
        console.log('\n=== Project Team Assignments ===');
        console.log('contentWriters:', project.assignedTeam?.contentWriters?.map(m => ({ _id: m?._id, name: m?.name })) || 'none');
        console.log('graphicDesigners:', project.assignedTeam?.graphicDesigners?.map(m => ({ _id: m?._id, name: m?.name })) || 'none');
        console.log('videoEditors:', project.assignedTeam?.videoEditors?.map(m => ({ _id: m?._id, name: m?.name })) || 'none');
        // Legacy fields
        console.log('contentWriter (legacy):', project.assignedTeam?.contentWriter?._id || 'none');
        console.log('graphicDesigner (legacy):', project.assignedTeam?.graphicDesigner?._id || 'none');
        console.log('videoEditor (legacy):', project.assignedTeam?.videoEditor?._id || 'none');

        // Log creative plan items
        console.log('\n=== Creative Plan Items ===');
        const savedCreativePlan = creativeStrategy.creativePlan || [];
        savedCreativePlan.forEach((item, idx) => {
          console.log(`Item ${idx + 1}:`, {
            name: item.name,
            creativeType: item.creativeType,
            subType: item.subType,
            objective: item.objective,
            assignedRole: item.assignedRole,
            assignedTeamMembers: item.assignedTeamMembers,
            contentWriter: item.contentWriter,
            platforms: item.platforms,
            screenSizes: item.screenSizes
          });
        });

        const generatedTasks = await generateTasksFromStrategy(
          projectId,
          creativeStrategy.toObject(),
          req.user._id
        );
        console.log(`\n=== TASK GENERATION COMPLETE ===`);
        console.log(`Generated ${generatedTasks?.length || 0} tasks for project ${projectId}`);
        console.log('========================================\n');
      } catch (taskError) {
        console.error('Error generating tasks:', taskError);
        console.error('Task error stack:', taskError.stack);
        // Don't fail the request if task generation fails
        // The strategy is still saved successfully
      }
    }

    // Get updated project
    const updatedProject = await Project.findById(projectId);

    res.status(200).json({
      success: true,
      data: {
        ...creativeStrategy.toObject(),
        completionPercentage: creativeStrategy.calculateCompletion(),
        projectProgress: {
          overallProgress: updatedProject.overallProgress,
          currentStage: updatedProject.currentStage,
          stages: getStageStatus(updatedProject)
        }
      }
    });
  } catch (error) {
    console.error('Creative strategy save error:', error);
    next(error);
  }
};

// @desc    Add creative to a stage
// @route   POST /api/creatives/:projectId/stages/:stage/creatives
// @access  Private
exports.addCreative = async (req, res, next) => {
  try {
    const { projectId, stage } = req.params;
    const { name, creativeType, platform, dimensions, copy, notes, assignedDesigner, assignedContentWriter, dueDate } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const validStages = ['awareness', 'consideration', 'conversion'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage. Must be awareness, consideration, or conversion'
      });
    }

    // Validate creative type
    const validCreativeTypes = ['static_creative', 'video_creative', 'video_content'];
    if (!validCreativeTypes.includes(creativeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid creative type. Must be static_creative, video_creative, or video_content'
      });
    }

    let creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      creativeStrategy = await CreativeStrategy.create({
        projectId,
        stages: [
          { stage: 'awareness', creatives: [], totalCreatives: 0 },
          { stage: 'consideration', creatives: [], totalCreatives: 0 },
          { stage: 'conversion', creatives: [], totalCreatives: 0 }
        ],
        createdBy: req.user._id
      });
    }

    // Find the stage
    const stageIndex = creativeStrategy.stages.findIndex(s => s.stage === stage);

    if (stageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Build creative data
    const newCreativeData = {
      name: name || `Creative ${creativeStrategy.stages[stageIndex].creatives.length + 1}`,
      creativeType,
      platform,
      dimensions: dimensions || {},
      copy: copy || {},
      notes: notes || '',
      assignedDesigner: assignedDesigner || null,
      dueDate: dueDate || null,
      status: 'pending',
      contentStatus: 'pending',
      designStatus: 'pending'
    };

    // Set content writer if provided
    if (assignedContentWriter) {
      newCreativeData.assignedContentWriter = assignedContentWriter;
      newCreativeData.contentAssignedAt = new Date();
    }

    // Add creative to stage
    creativeStrategy.stages[stageIndex].creatives.push(newCreativeData);
    creativeStrategy.calculateTotal();
    await creativeStrategy.save();

    // Get the newly created creative's ID
    const newCreative = creativeStrategy.stages[stageIndex].creatives[
      creativeStrategy.stages[stageIndex].creatives.length - 1
    ];

    // Auto-create content writing task if content writer assigned
    if (assignedContentWriter) {
      await Task.create({
        projectId,
        creativeStrategyId: creativeStrategy._id,
        creativeId: newCreative._id,
        creativeStage: stage,
        taskType: 'content_writing',
        assignedTo: assignedContentWriter,
        assignedBy: req.user._id,
        title: `Content for: ${name || `Creative ${creativeStrategy.stages[stageIndex].creatives.length}`}`,
        description: notes || `Write content for ${creativeType} creative on ${platform}`,
        createdBy: req.user._id
      });
    }

    // Return populated creative strategy
    const updatedStrategy = await CreativeStrategy.findById(creativeStrategy._id)
      .populate('stages.creatives.assignedDesigner', 'name email')
      .populate('stages.creatives.assignedContentWriter', 'name email');

    res.status(200).json({
      success: true,
      data: updatedStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update creative
// @route   PUT /api/creatives/:projectId/stages/:stage/creatives/:creativeId
// @access  Private
exports.updateCreative = async (req, res, next) => {
  try {
    const { projectId, stage, creativeId } = req.params;
    const { name, creativeType, platform, dimensions, copy, notes, assignedDesigner, assignedContentWriter, dueDate, status, contentStatus, designStatus, contentOutput } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Creative strategy not found'
      });
    }

    // Find the stage
    const stageIndex = creativeStrategy.stages.findIndex(s => s.stage === stage);

    if (stageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Find the creative
    const creativeIndex = creativeStrategy.stages[stageIndex].creatives.findIndex(
      c => c._id.toString() === creativeId
    );

    if (creativeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Creative not found'
      });
    }

    // Update creative
    const creative = creativeStrategy.stages[stageIndex].creatives[creativeIndex];

    if (name) creative.name = name;
    if (creativeType) creative.creativeType = creativeType;
    if (platform) creative.platform = platform;
    if (dimensions) creative.dimensions = dimensions;
    if (copy) creative.copy = copy;
    if (notes !== undefined) creative.notes = notes;
    if (assignedDesigner !== undefined) creative.assignedDesigner = assignedDesigner;
    if (assignedContentWriter !== undefined) {
      creative.assignedContentWriter = assignedContentWriter;
      creative.contentAssignedAt = new Date();
    }
    if (dueDate !== undefined) creative.dueDate = dueDate;
    if (status) creative.status = status;
    if (contentStatus) creative.contentStatus = contentStatus;
    if (designStatus) creative.designStatus = designStatus;
    if (contentOutput) creative.contentOutput = contentOutput;

    await creativeStrategy.save();

    const updatedStrategy = await CreativeStrategy.findById(creativeStrategy._id)
      .populate('stages.creatives.assignedDesigner', 'name email')
      .populate('stages.creatives.assignedContentWriter', 'name email');

    res.status(200).json({
      success: true,
      data: updatedStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete creative
// @route   DELETE /api/creatives/:projectId/stages/:stage/creatives/:creativeId
// @access  Private
exports.deleteCreative = async (req, res, next) => {
  try {
    const { projectId, stage, creativeId } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Creative strategy not found'
      });
    }

    // Find the stage
    const stageIndex = creativeStrategy.stages.findIndex(s => s.stage === stage);

    if (stageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found'
      });
    }

    // Remove creative
    creativeStrategy.stages[stageIndex].creatives = creativeStrategy.stages[stageIndex].creatives.filter(
      c => c._id.toString() !== creativeId
    );

    creativeStrategy.calculateTotal();
    await creativeStrategy.save();

    res.status(200).json({
      success: true,
      data: creativeStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate creative cards
// @route   POST /api/creatives/:projectId/generate
// @access  Private
exports.generateCreativeCards = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { awarenessCount, considerationCount, conversionCount } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    let creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      creativeStrategy = await CreativeStrategy.create({
        projectId,
        stages: [
          { stage: 'awareness', creatives: [], totalCreatives: 0 },
          { stage: 'consideration', creatives: [], totalCreatives: 0 },
          { stage: 'conversion', creatives: [], totalCreatives: 0 }
        ],
        createdBy: req.user._id
      });
    }

    // Generate creative cards for each stage
    const stages = [
      { stage: 'awareness', count: awarenessCount || 0 },
      { stage: 'consideration', count: considerationCount || 0 },
      { stage: 'conversion', count: conversionCount || 0 }
    ];

    for (const stageConfig of stages) {
      const stageIndex = creativeStrategy.stages.findIndex(s => s.stage === stageConfig.stage);
      if (stageIndex !== -1) {
        // Clear existing creatives
        creativeStrategy.stages[stageIndex].creatives = [];

        // Generate new creative cards
        for (let i = 0; i < stageConfig.count; i++) {
          creativeStrategy.stages[stageIndex].creatives.push({
            name: `${stageConfig.stage.charAt(0).toUpperCase() + stageConfig.stage.slice(1)} Creative ${i + 1}`,
            creativeType: 'image',
            platform: 'facebook',
            status: 'pending'
          });
        }
      }
    }

    creativeStrategy.calculateTotal();
    await creativeStrategy.save();

    res.status(200).json({
      success: true,
      data: creativeStrategy,
      message: `Generated ${creativeStrategy.totalCreatives} creative cards`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add ad type to creative strategy
// @route   POST /api/creatives/:projectId/ad-types
// @access  Private
exports.addAdType = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { typeKey, typeName, isCustom, icon } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    let creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      creativeStrategy = await CreativeStrategy.create({
        projectId,
        adTypes: [],
        stages: [
          { stage: 'awareness', creatives: [], totalCreatives: 0 },
          { stage: 'consideration', creatives: [], totalCreatives: 0 },
          { stage: 'conversion', creatives: [], totalCreatives: 0 }
        ],
        createdBy: req.user._id
      });
    }

    // Check if ad type already exists
    const existingAdType = creativeStrategy.adTypes.find(
      at => at.typeKey === typeKey
    );

    if (existingAdType) {
      return res.status(400).json({
        success: false,
        message: 'Ad type already exists in the strategy'
      });
    }

    // Add new ad type
    creativeStrategy.adTypes.push({
      typeKey,
      typeName,
      isCustom: isCustom || false,
      icon: icon || 'Megaphone',
      creatives: {
        imageCreatives: 0,
        videoCreatives: 0,
        carouselCreatives: 0,
        messagingAngle: '',
        hook: '',
        headline: '',
        cta: '',
        platforms: [],
        notes: ''
      },
      order: creativeStrategy.adTypes.length
    });

    await creativeStrategy.save();

    res.status(200).json({
      success: true,
      data: creativeStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove ad type from creative strategy
// @route   DELETE /api/creatives/:projectId/ad-types/:typeKey
// @access  Private
exports.removeAdType = async (req, res, next) => {
  try {
    const { projectId, typeKey } = req.params;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Creative strategy not found'
      });
    }

    // Remove ad type
    creativeStrategy.adTypes = creativeStrategy.adTypes.filter(
      at => at.typeKey !== typeKey
    );

    // Re-order remaining ad types
    creativeStrategy.adTypes.forEach((at, index) => {
      at.order = index;
    });

    creativeStrategy.calculateTotal();
    await creativeStrategy.save();

    res.status(200).json({
      success: true,
      data: creativeStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ad type details
// @route   PUT /api/creatives/:projectId/ad-types/:typeKey
// @access  Private
exports.updateAdType = async (req, res, next) => {
  try {
    const { projectId, typeKey } = req.params;
    const {
      imageCreatives,
      videoCreatives,
      carouselCreatives,
      messagingAngle,
      hook,
      headline,
      cta,
      platforms,
      notes
    } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    const creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Creative strategy not found'
      });
    }

    // Find the ad type
    const adTypeIndex = creativeStrategy.adTypes.findIndex(
      at => at.typeKey === typeKey
    );

    if (adTypeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ad type not found'
      });
    }

    // Update creative details
    const adType = creativeStrategy.adTypes[adTypeIndex];
    if (!adType.creatives) {
      adType.creatives = {};
    }

    if (imageCreatives !== undefined) adType.creatives.imageCreatives = imageCreatives;
    if (videoCreatives !== undefined) adType.creatives.videoCreatives = videoCreatives;
    if (carouselCreatives !== undefined) adType.creatives.carouselCreatives = carouselCreatives;
    if (messagingAngle !== undefined) adType.creatives.messagingAngle = messagingAngle;
    if (hook !== undefined) adType.creatives.hook = hook;
    if (headline !== undefined) adType.creatives.headline = headline;
    if (cta !== undefined) adType.creatives.cta = cta;
    if (platforms !== undefined) adType.creatives.platforms = platforms;
    if (notes !== undefined) adType.creatives.notes = notes;

    creativeStrategy.calculateTotal();
    await creativeStrategy.save();

    res.status(200).json({
      success: true,
      data: creativeStrategy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update additional notes
// @route   PUT /api/creatives/:projectId/notes
// @access  Private
exports.updateAdditionalNotes = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { additionalNotes } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    let creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      creativeStrategy = await CreativeStrategy.create({
        projectId,
        adTypes: [],
        stages: [
          { stage: 'awareness', creatives: [], totalCreatives: 0 },
          { stage: 'consideration', creatives: [], totalCreatives: 0 },
          { stage: 'conversion', creatives: [], totalCreatives: 0 }
        ],
        additionalNotes,
        createdBy: req.user._id
      });
    } else {
      creativeStrategy.additionalNotes = additionalNotes;
      await creativeStrategy.save();
    }

    res.status(200).json({
      success: true,
      data: creativeStrategy
    });
  } catch (error) {
    next(error);
  }
};