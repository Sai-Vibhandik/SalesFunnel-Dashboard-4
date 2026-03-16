const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MarketResearch = require('../models/MarketResearch');
const Offer = require('../models/Offer');
const TrafficStrategy = require('../models/TrafficStrategy');
const CreativeStrategy = require('../models/Creative');

// SOP References for different task types
const SOP_REFERENCES = {
  graphic_design: '/docs/sop/graphic-design-guide.pdf',
  video_editing: '/docs/sop/video-editing-guide.pdf',
  landing_page_design: '/docs/sop/landing-page-design-guide.pdf',
  landing_page_development: '/docs/sop/landing-page-development-guide.pdf',
  content_writing: '/docs/sop/content-writing-guide.pdf'
};

// Task type to asset type mapping
const TASK_ASSET_MAPPING = {
  image_creative: 'graphic_design',
  video_creative: 'video_editing',
  carousel_creative: 'graphic_design',
  reel: 'video_editing',
  static_ad: 'graphic_design',
  landing_page_design: 'landing_page_design',
  landing_page_page: 'landing_page_development'
};

/**
 * Generate tasks automatically when a creative strategy is completed
 * @param {string} projectId - The project ID
 * @param {object} creativeStrategy - The creative strategy document
 * @param {string} completedBy - User ID who completed the strategy
 */
async function generateTasksFromStrategy(projectId, creativeStrategy, completedBy) {
  try {
    // Get project with team assignments
    const project = await Project.findById(projectId)
      .populate('assignedTeam.performanceMarketer', 'name email')
      .populate('assignedTeam.contentCreator', 'name email')
      .populate('assignedTeam.contentWriter', 'name email')
      .populate('assignedTeam.uiUxDesigner', 'name email')
      .populate('assignedTeam.graphicDesigner', 'name email')
      .populate('assignedTeam.videoEditor', 'name email')
      .populate('assignedTeam.developer', 'name email')
      .populate('assignedTeam.tester', 'name email');

    if (!project) {
      throw new Error('Project not found');
    }

    // Get strategy context from all stages
    // Landing pages are embedded in the Project document, not in a separate collection
    const [marketResearch, offer, trafficStrategy] = await Promise.all([
      MarketResearch.findOne({ projectId }),
      Offer.findOne({ projectId }),
      TrafficStrategy.findOne({ projectId })
    ]);

    // Landing pages are embedded in the Project document
    const landingPages = project.landingPages || [];

    // Build strategy context for AI prompts
    const strategyContext = buildStrategyContext(marketResearch, offer, trafficStrategy, creativeStrategy, project);

    // Generate context links for team members
    const contextLink = `/projects/${projectId}/strategy-summary`;
    const contextPdfUrl = `/api/projects/${projectId}/strategy-summary/text`;

    // Generate tasks from creative strategy ad types (if creative strategy exists)
    const tasks = [];
    const adTypes = creativeStrategy?.adTypes || [];
    const creativePlan = creativeStrategy?.creativePlan || [];

    console.log(`Generating tasks for project ${project.businessName}:`);
    console.log(`- Ad types: ${adTypes.length}`);
    console.log(`- Creative plan items: ${creativePlan.length}`);
    console.log(`- Landing pages: ${landingPages.length}`);
    console.log(`- Team assignments:`, {
      contentCreator: project.assignedTeam?.contentCreator?._id || 'none',
      contentWriter: project.assignedTeam?.contentWriter?._id || 'none',
      graphicDesigner: project.assignedTeam?.graphicDesigner?._id || 'none',
      videoEditor: project.assignedTeam?.videoEditor?._id || 'none',
      uiUxDesigner: project.assignedTeam?.uiUxDesigner?._id || 'none',
      developer: project.assignedTeam?.developer?._id || 'none',
      tester: project.assignedTeam?.tester?._id || 'none'
    });

    // Generate tasks from legacy ad types
    for (const adType of adTypes) {
      const adTypeTasks = generateAdTypeTasks(adType, projectId, creativeStrategy?._id || null, strategyContext, project, completedBy, contextLink, contextPdfUrl);
      tasks.push(...adTypeTasks);
    }

    // Generate tasks from new creative plan
    if (creativePlan.length > 0) {
      const creativePlanTasks = generateCreativePlanTasks(creativePlan, projectId, creativeStrategy?._id || null, strategyContext, project, completedBy, contextLink, contextPdfUrl);
      tasks.push(...creativePlanTasks);
    }

    // Check for existing landing page tasks to prevent duplicates
    const existingLandingPageTasks = await Task.find({
      projectId,
      taskType: { $in: ['landing_page_design', 'landing_page_development'] }
    }).select('landingPageId');
    const existingLandingPageIds = new Set(existingLandingPageTasks.map(t => t.landingPageId?.toString()).filter(Boolean));

    // Generate landing page tasks for EACH landing page that doesn't already have tasks
    // Landing pages are embedded in the Project document
    for (const landingPage of landingPages) {
      // Skip if tasks already exist for this landing page
      if (existingLandingPageIds.has(landingPage._id.toString())) {
        console.log(`Skipping landing page ${landingPage.name || landingPage._id} - tasks already exist`);
        continue;
      }
      const landingPageTasks = generateLandingPageTasks(landingPage, projectId, creativeStrategy?._id || null, strategyContext, project, completedBy, contextLink, contextPdfUrl);
      tasks.push(...landingPageTasks);
    }

    // Only save if there are tasks to create
    if (tasks.length === 0) {
      console.log(`No tasks generated for project ${project.businessName} - no ad types, creative plan, or landing pages with assigned team members`);
      return [];
    }

    // Save all tasks
    const savedTasks = await Task.insertMany(tasks);

    // Send notifications to assigned users
    await sendTaskAssignmentNotifications(savedTasks, project);

    console.log(`Generated ${savedTasks.length} tasks for project ${project.businessName}`);
    return savedTasks;
  } catch (error) {
    console.error('Error generating tasks from strategy:', error);
    throw error;
  }
}

/**
 * Build strategy context for AI prompt generation
 */
function buildStrategyContext(marketResearch, offer, trafficStrategy, creativeStrategy, project) {
  const context = {
    // Business info
    businessName: project.businessName,
    industry: project.industry,
    customerName: project.customerName,

    // Market research
    targetAudience: {},
    painPoints: [],
    desires: [],

    // Offer
    offer: {},
    valueProposition: '',

    // Traffic strategy
    channels: [],
    hooks: [],

    // Creative strategy
    creativeTypes: [],
    platforms: []
  };

  // Extract market research data
  if (marketResearch) {
    context.targetAudience = {
      ageRange: marketResearch.avatar?.ageRange || '',
      location: marketResearch.avatar?.location || '',
      income: marketResearch.avatar?.income || '',
      profession: marketResearch.avatar?.profession || '',
      interests: marketResearch.avatar?.interests || []
    };
    context.painPoints = marketResearch.painPoints || [];
    context.desires = marketResearch.desires || [];
  }

  // Extract offer data
  if (offer) {
    context.offer = {
      functionalValue: offer.functionalValue,
      emotionalValue: offer.emotionalValue,
      bonuses: offer.bonuses,
      guarantees: offer.guarantees,
      pricing: offer.pricing
    };
    context.valueProposition = `${offer.functionalValue || ''} ${offer.emotionalValue || ''}`.trim();
  }

  // Extract traffic strategy data
  if (trafficStrategy) {
    context.channels = (trafficStrategy.channels || [])
      .filter(c => c.isSelected)
      .map(c => c.name);
    context.hooks = (trafficStrategy.hooks || []).map(h => h.content);
  }

  // Extract creative strategy data (handle null creativeStrategy)
  if (creativeStrategy && creativeStrategy.adTypes) {
    context.creativeTypes = (creativeStrategy.adTypes || []).map(at => ({
      typeKey: at.typeKey,
      typeName: at.typeName,
      platforms: at.creatives?.platforms || [],
      hook: at.creatives?.hook,
      headline: at.creatives?.headline,
      cta: at.creatives?.cta,
      messagingAngle: at.creatives?.messagingAngle
    }));
    context.platforms = (creativeStrategy.adTypes || [])
      .flatMap(at => at.creatives?.platforms || [])
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  }

  return context;
}

/**
 * Generate tasks for a specific ad type
 */
function generateAdTypeTasks(adType, projectId, creativeStrategyId, strategyContext, project, completedBy, contextLink, contextPdfUrl) {
  const tasks = [];
  const creatives = adType.creatives || {};

  // Get assigned team members
  const contentWriter = project.assignedTeam.contentWriter?._id;
  const graphicDesigner = project.assignedTeam.graphicDesigner?._id;
  const tester = project.assignedTeam.tester?._id;

  // Get platforms array
  const platforms = creatives.platforms || [];

  // Generate image creative tasks
  if (creatives.imageCreatives > 0) {
    for (let i = 0; i < creatives.imageCreatives; i++) {
      const platform = platforms[i % platforms.length] || 'general';

      // Content writing task (first in workflow)
      if (contentWriter) {
        const contentTask = createTask({
          projectId,
          creativeStrategyId,
          adTypeKey: adType.typeKey,
          adTypeName: adType.typeName,
          taskType: 'content_creation',
          assetType: 'image_creative_content',
          creativeOutputType: 'image_creative',
          taskTitle: `${adType.typeName} - Content for Image ${i + 1}`,
          assignedRole: 'content_writer',
          assignedTo: contentWriter,
          strategyContext,
          contextLink,
          contextPdfUrl,
          platform,
          platforms,
          hook: creatives.hook,
          headline: creatives.headline,
          cta: creatives.cta,
          messagingAngle: creatives.messagingAngle,
          notes: creatives.notes,
          completedBy
        });
        contentTask.status = 'content_pending';
        tasks.push(contentTask);
      }

      // Design task (after content approved)
      const designTask = createTask({
        projectId,
        creativeStrategyId,
        adTypeKey: adType.typeKey,
        adTypeName: adType.typeName,
        taskType: 'graphic_design',
        assetType: 'image_creative',
        taskTitle: `${adType.typeName} - Image Creative ${i + 1}`,
        assignedRole: 'graphic_designer',
        assignedTo: graphicDesigner,
        strategyContext,
        contextLink,
        contextPdfUrl,
        platform,
        platforms,
        hook: creatives.hook,
        headline: creatives.headline,
        cta: creatives.cta,
        messagingAngle: creatives.messagingAngle,
        notes: creatives.notes,
        completedBy
      });
      // Set initial status based on content writer presence
      designTask.status = contentWriter ? 'design_pending' : 'todo';
      if (contentWriter) {
        designTask.description = 'This task will become active after content is approved.';
      }
      tasks.push(designTask);
    }
  }

  // Generate video creative tasks
  if (creatives.videoCreatives > 0) {
    for (let i = 0; i < creatives.videoCreatives; i++) {
      const platform = platforms[i % platforms.length] || 'general';

      // Content writing task
      if (contentWriter) {
        const contentTask = createTask({
          projectId,
          creativeStrategyId,
          adTypeKey: adType.typeKey,
          adTypeName: adType.typeName,
          taskType: 'content_creation',
          assetType: 'video_creative_content',
          creativeOutputType: 'video_creative',
          taskTitle: `${adType.typeName} - Script for Video ${i + 1}`,
          assignedRole: 'content_writer',
          assignedTo: contentWriter,
          strategyContext,
          contextLink,
          contextPdfUrl,
          platform,
          platforms,
          hook: creatives.hook,
          headline: creatives.headline,
          cta: creatives.cta,
          messagingAngle: creatives.messagingAngle,
          notes: creatives.notes,
          completedBy
        });
        contentTask.status = 'content_pending';
        tasks.push(contentTask);
      }

      // Video editing task
      const videoTask = createTask({
        projectId,
        creativeStrategyId,
        adTypeKey: adType.typeKey,
        adTypeName: adType.typeName,
        taskType: 'video_editing',
        assetType: 'video_creative',
        taskTitle: `${adType.typeName} - Video Creative ${i + 1}`,
        assignedRole: 'video_editor',
        assignedTo: project.assignedTeam.videoEditor?._id,
        strategyContext,
        contextLink,
        contextPdfUrl,
        platform,
        platforms,
        hook: creatives.hook,
        headline: creatives.headline,
        cta: creatives.cta,
        messagingAngle: creatives.messagingAngle,
        notes: creatives.notes,
        completedBy
      });
      videoTask.status = contentWriter ? 'design_pending' : 'todo';
      if (contentWriter) {
        videoTask.description = 'This task will become active after content is approved.';
      }
      tasks.push(videoTask);
    }
  }

  // Generate carousel creative tasks
  if (creatives.carouselCreatives > 0) {
    for (let i = 0; i < creatives.carouselCreatives; i++) {
      const platform = platforms[i % platforms.length] || 'general';

      // Content writing task
      if (contentWriter) {
        const contentTask = createTask({
          projectId,
          creativeStrategyId,
          adTypeKey: adType.typeKey,
          adTypeName: adType.typeName,
          taskType: 'content_creation',
          assetType: 'carousel_creative_content',
          creativeOutputType: 'carousel_creative',
          taskTitle: `${adType.typeName} - Content for Carousel ${i + 1}`,
          assignedRole: 'content_writer',
          assignedTo: contentWriter,
          strategyContext,
          contextLink,
          contextPdfUrl,
          platform,
          platforms,
          hook: creatives.hook,
          headline: creatives.headline,
          cta: creatives.cta,
          messagingAngle: creatives.messagingAngle,
          notes: creatives.notes,
          completedBy
        });
        contentTask.status = 'content_pending';
        tasks.push(contentTask);
      }

      // Design task
      const carouselTask = createTask({
        projectId,
        creativeStrategyId,
        adTypeKey: adType.typeKey,
        adTypeName: adType.typeName,
        taskType: 'graphic_design',
        assetType: 'carousel_creative',
        taskTitle: `${adType.typeName} - Carousel Creative ${i + 1}`,
        assignedRole: 'graphic_designer',
        assignedTo: graphicDesigner,
        strategyContext,
        contextLink,
        contextPdfUrl,
        platform,
        platforms,
        hook: creatives.hook,
        headline: creatives.headline,
        cta: creatives.cta,
        messagingAngle: creatives.messagingAngle,
        notes: creatives.notes,
        completedBy
      });
      carouselTask.status = contentWriter ? 'design_pending' : 'todo';
      if (contentWriter) {
        carouselTask.description = 'This task will become active after content is approved.';
      }
      tasks.push(carouselTask);
    }
  }

  return tasks;
}

/**
 * Generate tasks for landing page
 * Landing Page Workflow: UI_UX_DESIGNER → TESTER → PERFORMANCE_MARKETER → DEVELOPER → TESTER → PERFORMANCE_MARKETER
 */
function generateLandingPageTasks(landingPage, projectId, creativeStrategyId, strategyContext, project, completedBy, contextLink, contextPdfUrl) {
  const tasks = [];

  const uiuxDesigner = project.assignedTeam.uiUxDesigner?._id;
  const developer = project.assignedTeam.developer?._id;

  // Landing page design task (starts the workflow)
  // Status flow: design_pending → design_submitted → design_approved → development_pending → development_submitted → development_approved → final_approved
  const designTask = createTask({
    projectId,
    landingPageId: landingPage._id,
    creativeStrategyId,
    taskType: 'landing_page_design',
    assetType: 'landing_page_design',
    taskTitle: `Design: ${landingPage.name || 'Landing Page'}`,
    assignedRole: 'ui_ux_designer',
    assignedTo: uiuxDesigner,
    strategyContext,
    contextLink,
    contextPdfUrl,
    landingPageType: landingPage.type, // 'type' in LandingPage model
    leadCapture: landingPage.leadCapture, // Lead capture object
    headline: landingPage.headline,
    subheadline: landingPage.subheadline,
    cta: landingPage.ctaText, // 'ctaText' in LandingPage model
    hook: landingPage.hook,
    messagingAngle: landingPage.angle,
    platform: landingPage.platform,
    completedBy
  });
  designTask.status = 'design_pending'; // Ready for UI/UX Designer to start
  tasks.push(designTask);

  // Landing page development task (will be activated after design is approved by marketer)
  const devTask = createTask({
    projectId,
    landingPageId: landingPage._id,
    creativeStrategyId,
    taskType: 'landing_page_development',
    assetType: 'landing_page_page',
    taskTitle: `Develop: ${landingPage.name || 'Landing Page'}`,
    assignedRole: 'developer',
    assignedTo: developer,
    strategyContext,
    contextLink,
    contextPdfUrl,
    landingPageType: landingPage.type, // 'type' in LandingPage model
    completedBy
  });
  devTask.status = 'development_pending'; // Waiting for design to be approved
  devTask.description = 'This task will become active after the design is approved by the marketer.';
  tasks.push(devTask);

  return tasks;
}

/**
 * Generate tasks from the new creative plan structure
 * Each creative plan item creates a content task and a design/edit task
 */
function generateCreativePlanTasks(creativePlan, projectId, creativeStrategyId, strategyContext, project, completedBy, contextLink, contextPdfUrl) {
  const tasks = [];

  const contentWriter = project.assignedTeam.contentWriter?._id;
  const graphicDesigner = project.assignedTeam.graphicDesigner?._id;
  const videoEditor = project.assignedTeam.videoEditor?._id;

  // Creative type to task type mapping - determines which design role receives the task
  const creativeTypeTaskMap = {
    'IMAGE': { contentTask: 'content_creation', designTask: 'graphic_design', assetType: 'image_creative', creativeOutputType: 'image_creative' },
    'VIDEO': { contentTask: 'content_creation', designTask: 'video_editing', assetType: 'video_creative', creativeOutputType: 'video_creative' },
    'CAROUSEL': { contentTask: 'content_creation', designTask: 'graphic_design', assetType: 'carousel_creative', creativeOutputType: 'carousel_creative' }
  };

  // Legacy category to task type mapping (for backward compatibility)
  const categoryTaskTypeMap = {
    'IMAGE': { contentTask: 'content_creation', designTask: 'graphic_design', assetType: 'image_creative', creativeOutputType: 'image_creative' },
    'VIDEO': { contentTask: 'content_creation', designTask: 'video_editing', assetType: 'video_creative', creativeOutputType: 'video_creative' },
    'CAROUSEL': { contentTask: 'content_creation', designTask: 'graphic_design', assetType: 'carousel_creative', creativeOutputType: 'carousel_creative' },
    'UGC': { contentTask: 'content_creation', designTask: 'video_editing', assetType: 'ugc_content', creativeOutputType: 'ugc_content' },
    'TESTIMONIAL': { contentTask: 'content_creation', designTask: 'video_editing', assetType: 'testimonial_content', creativeOutputType: 'testimonial_content' },
    'DEMO_EXPLAINER': { contentTask: 'content_creation', designTask: 'video_editing', assetType: 'demo_video', creativeOutputType: 'demo_video' },
    'OFFER_SALES': { contentTask: 'content_creation', designTask: 'graphic_design', assetType: 'offer_creative', creativeOutputType: 'offer_creative' }
  };

  // Role to assigned user mapping (default team members from project)
  const roleToUserMap = {
    'content_writer': contentWriter,
    'graphic_designer': graphicDesigner,
    'video_editor': videoEditor
  };

  for (let i = 0; i < creativePlan.length; i++) {
    const planItem = creativePlan[i];

    // Determine creative type from new field or legacy category
    const creativeType = planItem.creativeType || planItem.category || 'IMAGE';

    // Get task configuration - use new creativeType mapping first, fall back to legacy category mapping
    let taskConfig = creativeTypeTaskMap[creativeType];
    if (!taskConfig) {
      taskConfig = categoryTaskTypeMap[creativeType] || categoryTaskTypeMap['IMAGE'];
    }

    const platformStr = (planItem.platforms || []).join(', ');
    const screenSizesStr = (planItem.screenSizes || []).join(', ');

    // Build task title from name or subType
    const taskTitle = planItem.name || planItem.subType || planItem.adType || `Creative ${i + 1}`;

    // Get assigned role and team members from plan item or use defaults
    const assignedRole = planItem.assignedRole || (creativeType === 'VIDEO' ? 'video_editor' : 'graphic_designer');
    const assignedTeamMembers = planItem.assignedTeamMembers || [];

    // If assigned team members are specified, use the first one as primary assignee
    // Otherwise fall back to project's default team member for that role
    let designAssignedTo = null;
    if (assignedTeamMembers.length > 0) {
      designAssignedTo = assignedTeamMembers[0];
    } else {
      designAssignedTo = roleToUserMap[assignedRole] || graphicDesigner;
    }

    // Content writing task (first in workflow) - assigned to content_writer
    // Use assigned team members if specified, otherwise use default content writer
    const contentAssignedTo = assignedTeamMembers.length > 0 && planItem.assignedRole === 'content_writer'
      ? assignedTeamMembers[0]
      : contentWriter;

    if (contentAssignedTo) {
      const contentTask = createTask({
        projectId,
        creativeStrategyId,
        taskType: taskConfig.contentTask,
        assetType: `${taskConfig.assetType}_content`,
        creativeOutputType: taskConfig.creativeOutputType,
        taskTitle: `Content: ${taskTitle}`,
        assignedRole: 'content_writer',
        assignedTo: contentAssignedTo,
        strategyContext,
        contextLink,
        contextPdfUrl,
        platform: platformStr,
        platforms: planItem.platforms || [],
        screenSizes: screenSizesStr,
        notes: planItem.notes || '',
        creativeType: planItem.subType || planItem.adType || taskTitle,
        creativeCategory: creativeType,
        objective: planItem.objective || '',
        completedBy
      });
      contentTask.status = 'content_pending';
      tasks.push(contentTask);
    }

    // Design/Edit task - assigned based on creative type or specified role
    // For VIDEO: video_editor, For IMAGE/CAROUSEL: graphic_designer
    const designRoleForTask = creativeType === 'VIDEO' ? 'video_editor' : 'graphic_designer';

    const designTask = createTask({
      projectId,
      creativeStrategyId,
      taskType: taskConfig.designTask,
      assetType: taskConfig.assetType,
      taskTitle: taskTitle,
      assignedRole: designRoleForTask,
      assignedTo: designAssignedTo,
      strategyContext,
      contextLink,
      contextPdfUrl,
      platform: platformStr,
      platforms: planItem.platforms || [],
      screenSizes: screenSizesStr,
      notes: planItem.notes || '',
      creativeType: planItem.subType || planItem.adType || taskTitle,
      creativeCategory: creativeType,
      objective: planItem.objective || '',
      completedBy
    });
    designTask.status = 'design_pending';
    if (contentWriter || contentAssignedTo) {
      designTask.description = 'This task will become active after content is approved.';
    }
    tasks.push(designTask);
  }

  console.log(`Generated ${tasks.length} tasks from creative plan with ${creativePlan.length} items`);
  return tasks;
}

/**
 * Create a task object
 */
function createTask({
  projectId,
  creativeStrategyId = null,
  landingPageId = null,
  adTypeKey = null,
  adTypeName = null,
  taskType,
  assetType,
  creativeOutputType = null,
  taskTitle,
  assignedRole,
  assignedTo,
  strategyContext,
  contextLink = '',
  contextPdfUrl = '',
  platform = '',
  platforms = [],
  screenSizes = '',
  hook = '',
  headline = '',
  cta = '',
  messagingAngle = '',
  notes = '',
  creativeType = '',
  creativeCategory = '',
  objective = '',
  landingPageType = '',
  leadCapture = null,
  completedBy
}) {
  // Generate AI prompt based on strategy context
  const aiPrompt = generateAIPrompt(taskType, assetType, {
    strategyContext,
    platforms,
    hook,
    headline,
    cta,
    messagingAngle,
    notes,
    landingPageType,
    leadCapture
  });

  const task = {
    projectId,
    taskType,
    assetType,
    creativeOutputType,
    taskTitle,
    assignedRole,
    assignedTo: assignedTo || null,
    assignedBy: completedBy,
    createdBy: completedBy,
    status: Task.getInitialStatus(taskType),
    description: generateTaskDescription(taskType, assetType, strategyContext),
    aiPrompt,
    sopReference: SOP_REFERENCES[taskType] || '',
    contextLink,
    contextPdfUrl,
    strategyContext: {
      // Business context
      businessName: strategyContext.businessName,
      industry: strategyContext.industry,

      // Creative identification
      funnelStage: adTypeKey || objective, // awareness, consideration, conversion, etc. OR campaign objective
      creativeType: assetType, // image_creative, video_creative, etc.
      platform: platform, // Primary platform for this task
      platforms: platforms, // All applicable platforms
      screenSizes: screenSizes, // Screen sizes for this creative

      // Creative brief content
      hook: hook || '',
      creativeAngle: messagingAngle || '',
      messaging: messagingAngle || '',
      headline: headline || '',
      cta: cta || '',

      // Target audience
      targetAudience: `${strategyContext.targetAudience?.ageRange || ''} ${strategyContext.targetAudience?.profession || ''}`.trim(),
      painPoints: strategyContext.painPoints || [],
      desires: strategyContext.desires || [],

      // Offer information
      offer: strategyContext.valueProposition || '',

      // Additional context
      notes: notes || '',
      adTypeKey: adTypeKey,
      adTypeName: adTypeName,

      // Creative plan fields
      creativeType: creativeType || adTypeName || '',
      creativeCategory: creativeCategory || ''
    },
    dueDate: calculateDueDate(taskType)
  };

  if (creativeStrategyId) {
    task.creativeStrategyId = creativeStrategyId;
    task.adTypeKey = adTypeKey;
  }

  if (landingPageId) {
    task.landingPageId = landingPageId;
  }

  if (creativeOutputType) {
    task.creativeOutputType = creativeOutputType;
  }

  return task;
}

/**
 * Generate AI prompt for creative brief
 */
function generateAIPrompt(taskType, assetType, context) {
  const { strategyContext, platforms, hook, headline, cta, messagingAngle, notes, landingPageType, leadCapture } = context;

  if (taskType === 'landing_page_design') {
    return `Create a landing page design for ${strategyContext.businessName || 'a business'} in the ${strategyContext.industry || 'specified'} industry.

TARGET AUDIENCE:
${strategyContext.targetAudience?.ageRange ? `Age Range: ${strategyContext.targetAudience.ageRange}` : ''}
${strategyContext.targetAudience?.profession ? `Profession: ${strategyContext.targetAudience.profession}` : ''}
${strategyContext.targetAudience?.interests?.length ? `Interests: ${strategyContext.targetAudience.interests.join(', ')}` : ''}

PAIN POINTS TO ADDRESS:
${strategyContext.painPoints?.length ? strategyContext.painPoints.map(p => `- ${p}`).join('\n') : 'Address customer challenges'}

DESIRES & GOALS:
${strategyContext.desires?.length ? strategyContext.desires.map(d => `- ${d}`).join('\n') : 'Help customers achieve their goals'}

OFFER & VALUE PROPOSITION:
${strategyContext.offer || 'Create compelling value'}

LANDING PAGE TYPE: ${landingPageType || 'video_sales_letter'}
${leadCapture?.method ? `LEAD CAPTURE METHOD: ${leadCapture.method}` : ''}
${headline ? `HEADLINE: ${headline}` : ''}
${cta ? `CALL-TO-ACTION: ${cta}` : ''}

${messagingAngle ? `MESSAGING ANGLE: ${messagingAngle}` : ''}

Design a landing page that converts. Focus on clear hierarchy, compelling visuals, and a strong call-to-action.`;
  }

  if (taskType === 'landing_page_development') {
    return `Develop a landing page for ${strategyContext.businessName || 'a business'}.

LANDING PAGE TYPE: ${landingPageType || 'video_sales_letter'}
${leadCapture?.method ? `LEAD CAPTURE INTEGRATION: ${leadCapture.method}` : ''}

Ensure responsive design, fast loading times, and proper integration with:
- Lead capture forms
- Email marketing tools
- Analytics tracking

Focus on conversion optimization and user experience.`;
  }

  // Default for creative tasks
  return `Create a ${assetType?.replace(/_/g, ' ') || 'creative asset'} for ${strategyContext.businessName || 'a business'} in the ${strategyContext.industry || 'specified'} industry.

TARGET AUDIENCE:
${strategyContext.targetAudience?.ageRange ? `Age Range: ${strategyContext.targetAudience.ageRange}` : ''}
${strategyContext.targetAudience?.profession ? `Profession: ${strategyContext.targetAudience.profession}` : ''}

KEY PAIN POINTS:
${strategyContext.painPoints?.slice(0, 3).map(p => `- ${p}`).join('\n') || 'Understand customer challenges'}

CUSTOMER DESIRES:
${strategyContext.desires?.slice(0, 3).map(d => `- ${d}`).join('\n') || 'Help customers achieve their goals'}

VALUE PROPOSITION:
${strategyContext.offer || 'Create compelling value'}

${messagingAngle ? `MESSAGING ANGLE: ${messagingAngle}` : ''}
${hook ? `HOOK: ${hook}` : ''}
${headline ? `HEADLINE: ${headline}` : ''}
${cta ? `CALL-TO-ACTION: ${cta}` : ''}

${platforms?.length ? `PLATFORMS: ${platforms.join(', ')}` : ''}

${notes ? `ADDITIONAL NOTES: ${notes}` : ''}

Create engaging, on-brand creative that drives action while maintaining brand consistency.`;
}

/**
 * Generate task description
 */
function generateTaskDescription(taskType, assetType, strategyContext) {
  const businessName = strategyContext.businessName || 'the project';
  const industry = strategyContext.industry ? ` in the ${strategyContext.industry} industry` : '';

  switch (taskType) {
    case 'graphic_design':
      return `Design ${assetType?.replace(/_/g, ' ')} assets for ${businessName}${industry}. Follow the brand guidelines and creative brief provided.`;
    case 'video_editing':
      return `Create video content for ${businessName}${industry}. Focus on engagement and conversions while maintaining brand consistency.`;
    case 'landing_page_design':
      return `Design the landing page for ${businessName}${industry}. Focus on conversion optimization and user experience.`;
    case 'landing_page_development':
      return `Develop the landing page for ${businessName}${industry}. Ensure responsive design and integration with marketing tools.`;
    case 'content_writing':
      return `Write compelling content for ${businessName}${industry}. Follow the messaging strategy and brand voice.`;
    default:
      return `Complete the ${taskType?.replace(/_/g, ' ')} task for ${businessName}.`;
  }
}

/**
 * Calculate due date based on task type
 */
function calculateDueDate(taskType) {
  const daysToAdd = {
    graphic_design: 3,
    video_editing: 5,
    landing_page_design: 5,
    landing_page_development: 7,
    content_writing: 2
  };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (daysToAdd[taskType] || 3));
  return dueDate;
}

/**
 * Send task assignment notifications
 */
async function sendTaskAssignmentNotifications(tasks, project) {
  const tasksByUser = {};

  // Group tasks by assigned user
  for (const task of tasks) {
    if (task.assignedTo) {
      if (!tasksByUser[task.assignedTo]) {
        tasksByUser[task.assignedTo] = [];
      }
      tasksByUser[task.assignedTo].push(task);
    }
  }

  // Send notifications
  for (const [userId, userTasks] of Object.entries(tasksByUser)) {
    const taskCount = userTasks.length;
    const projectDisplay = project.projectName || project.businessName;

    await Notification.create({
      recipient: userId,
      type: 'task_assigned',
      title: 'New Tasks Assigned',
      message: `You have been assigned ${taskCount} new task${taskCount > 1 ? 's' : ''} for project "${projectDisplay}".`,
      projectId: project._id
    });
  }
}

/**
 * Get all tasks for a project
 */
async function getTasksByProject(projectId, filters = {}) {
  const query = { projectId };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.taskType) {
    query.taskType = filters.taskType;
  }
  if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }
  if (filters.assignedRole) {
    query.assignedRole = filters.assignedRole;
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('testerReviewedBy', 'name email')
    .populate('marketerApprovedBy', 'name email')
    .sort({ createdAt: -1 });

  return tasks;
}

/**
 * Get tasks for a user by role
 */
async function getTasksByUser(userId, role, filters = {}) {
  const query = { assignedTo: userId };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.taskType) {
    query.taskType = filters.taskType;
  }

  const tasks = await Task.find(query)
    .populate('projectId', 'projectName businessName')
    .populate('assignedBy', 'name email')
    .sort({ priority: -1, dueDate: 1 });

  return tasks;
}

/**
 * Update task status and handle workflow transitions
 */
async function updateTaskStatus(taskId, newStatus, userId, notes = '') {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  const oldStatus = task.status;
  task.status = newStatus;
  task.addRevision(userId, notes, oldStatus, newStatus);

  // Update timestamps based on status
  if (newStatus === 'in_progress' && !task.startedAt) {
    task.startedAt = new Date();
  }
  if (newStatus === 'submitted' || newStatus === 'design_submitted' || newStatus === 'development_submitted') {
    task.submittedAt = new Date();
  }
  if (newStatus === 'final_approved') {
    task.completedAt = new Date();
  }
  if (newStatus === 'rejected') {
    task.rejectionNote = notes;
    task.reviewedAt = new Date();
  }

  await task.save();
  return task;
}

module.exports = {
  generateTasksFromStrategy,
  getTasksByProject,
  getTasksByUser,
  updateTaskStatus,
  buildStrategyContext,
  generateAIPrompt,
  SOP_REFERENCES
};