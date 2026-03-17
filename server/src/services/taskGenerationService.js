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
    console.log('\n========================================');
    console.log('=== TASK GENERATION STARTED ===');
    console.log('========================================');
    console.log(`Project ID: ${projectId}`);
    console.log(`Completed by: ${completedBy}`);
    console.log(`Creative Strategy ID: ${creativeStrategy?._id}`);

    // Get project with team assignments - populate both new array fields and legacy fields
    const project = await Project.findById(projectId)
      .populate('assignedTeam.performanceMarketers', 'name email')
      .populate('assignedTeam.contentWriters', 'name email')
      .populate('assignedTeam.uiUxDesigners', 'name email')
      .populate('assignedTeam.graphicDesigners', 'name email')
      .populate('assignedTeam.videoEditors', 'name email')
      .populate('assignedTeam.developers', 'name email')
      .populate('assignedTeam.testers', 'name email')
      // Legacy fields for backward compatibility
      .populate('assignedTeam.performanceMarketer', 'name email')
      .populate('assignedTeam.contentCreator', 'name email')
      .populate('assignedTeam.contentWriter', 'name email')
      .populate('assignedTeam.uiUxDesigner', 'name email')
      .populate('assignedTeam.graphicDesigner', 'name email')
      .populate('assignedTeam.videoEditor', 'name email')
      .populate('assignedTeam.developer', 'name email')
      .populate('assignedTeam.tester', 'name email');

    if (!project) {
      console.error('ERROR: Project not found');
      throw new Error('Project not found');
    }

    console.log(`\n=== Project Info ===`);
    console.log(`Business Name: ${project.businessName}`);
    console.log(`Project Name: ${project.projectName}`);

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

    console.log(`\n=== Creative Strategy Data ===`);
    console.log(`- Ad types: ${adTypes.length}`);
    console.log(`- Creative plan items: ${creativePlan.length}`);
    console.log(`- Landing pages: ${landingPages.length}`);

    if (creativePlan.length > 0) {
      console.log(`\n=== Creative Plan Items ===`);
      creativePlan.forEach((item, idx) => {
        console.log(`Item ${idx + 1}:`, {
          name: item.name,
          creativeType: item.creativeType,
          subType: item.subType,
          objective: item.objective,
          assignedRole: item.assignedRole,
          assignedTeamMembers: item.assignedTeamMembers,
          notes: item.notes
        });
      });
    }

    console.log(`\n=== Team Assignments ===`);
    console.log(`contentWriters:`, project.assignedTeam?.contentWriters?.map(m => ({ _id: m?._id, name: m?.name })) || 'none');
    console.log(`graphicDesigners:`, project.assignedTeam?.graphicDesigners?.map(m => ({ _id: m?._id, name: m?.name })) || 'none');
    console.log(`videoEditors:`, project.assignedTeam?.videoEditors?.map(m => ({ _id: m?._id, name: m?.name })) || 'none');
    // Legacy fields
    console.log(`contentWriter (legacy):`, project.assignedTeam?.contentWriter?._id || 'none');
    console.log(`graphicDesigner (legacy):`, project.assignedTeam?.graphicDesigner?._id || 'none');
    console.log(`videoEditor (legacy):`, project.assignedTeam?.videoEditor?._id || 'none');

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

  // Helper function to get first team member for a role
  const getFirstMember = (role) => {
    const roleFieldMap = {
      'content_writer': { arrayField: 'contentWriters', legacyField: 'contentWriter' },
      'graphic_designer': { arrayField: 'graphicDesigners', legacyField: 'graphicDesigner' },
      'video_editor': { arrayField: 'videoEditors', legacyField: 'videoEditor' },
      'ui_ux_designer': { arrayField: 'uiUxDesigners', legacyField: 'uiUxDesigner' },
      'developer': { arrayField: 'developers', legacyField: 'developer' },
      'tester': { arrayField: 'testers', legacyField: 'tester' }
    };

    const fieldConfig = roleFieldMap[role];
    if (!fieldConfig) return null;

    // Check new array field first
    const arrayMembers = project.assignedTeam?.[fieldConfig.arrayField];
    if (arrayMembers && Array.isArray(arrayMembers) && arrayMembers.length > 0) {
      return arrayMembers[0]._id || arrayMembers[0];
    }

    // Fall back to legacy field
    const legacyMember = project.assignedTeam?.[fieldConfig.legacyField];
    if (legacyMember) {
      return legacyMember._id || legacyMember;
    }

    return null;
  };

  // Get assigned team members
  const contentWriter = getFirstMember('content_writer');
  const graphicDesigner = getFirstMember('graphic_designer');
  const videoEditor = getFirstMember('video_editor');
  const tester = getFirstMember('tester');

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
        assignedTo: videoEditor,
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

  // Helper function to get first team member for a role (supports both array and legacy fields)
  const getFirstMember = (role) => {
    const roleFieldMap = {
      'ui_ux_designer': { arrayField: 'uiUxDesigners', legacyField: 'uiUxDesigner' },
      'developer': { arrayField: 'developers', legacyField: 'developer' }
    };

    const fieldConfig = roleFieldMap[role];
    if (!fieldConfig) return null;

    // Check new array field first
    const arrayMembers = project.assignedTeam?.[fieldConfig.arrayField];
    if (arrayMembers && Array.isArray(arrayMembers) && arrayMembers.length > 0) {
      return arrayMembers[0]._id || arrayMembers[0];
    }

    // Fall back to legacy field
    const legacyMember = project.assignedTeam?.[fieldConfig.legacyField];
    if (legacyMember) {
      return legacyMember._id || legacyMember;
    }

    return null;
  };

  // Use landing-page-specific assignments if available, otherwise fall back to project-level assignments
  let uiuxDesigner = landingPage.assignedDesigner || null;
  let developer = landingPage.assignedDeveloper || null;

  // Fall back to project-level assignments if not set on landing page
  if (!uiuxDesigner) {
    uiuxDesigner = getFirstMember('ui_ux_designer');
  }
  if (!developer) {
    developer = getFirstMember('developer');
  }

  console.log(`\n=== Landing Page: ${landingPage.name || 'Unnamed'} ===`);
  console.log(`Assigned Designer: ${uiuxDesigner || 'Not assigned'}`);
  console.log(`Assigned Developer: ${developer || 'Not assigned'}`);

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

  // Helper function to get team member(s) for a role
  // Supports both new array fields and legacy single fields
  const getTeamMembersForRole = (role) => {
    const roleFieldMap = {
      'content_writer': { arrayField: 'contentWriters', legacyField: 'contentWriter' },
      'graphic_designer': { arrayField: 'graphicDesigners', legacyField: 'graphicDesigner' },
      'video_editor': { arrayField: 'videoEditors', legacyField: 'videoEditor' },
      'ui_ux_designer': { arrayField: 'uiUxDesigners', legacyField: 'uiUxDesigner' },
      'developer': { arrayField: 'developers', legacyField: 'developer' },
      'tester': { arrayField: 'testers', legacyField: 'tester' }
    };

    const fieldConfig = roleFieldMap[role];
    if (!fieldConfig) return null;

    // Check new array field first (preferred)
    const arrayMembers = project.assignedTeam?.[fieldConfig.arrayField];
    if (arrayMembers && Array.isArray(arrayMembers) && arrayMembers.length > 0) {
      return arrayMembers; // Return array of user objects
    }

    // Fall back to legacy field
    const legacyMember = project.assignedTeam?.[fieldConfig.legacyField];
    if (legacyMember) {
      return [legacyMember]; // Return as array for consistency
    }

    return null;
  };

  // Get default team members from project assignment
  const defaultContentWriters = getTeamMembersForRole('content_writer');
  const defaultGraphicDesigners = getTeamMembersForRole('graphic_designer');
  const defaultVideoEditors = getTeamMembersForRole('video_editor');

  console.log('Team assignments for task generation:', {
    contentWriters: defaultContentWriters?.map(m => m?._id || m),
    graphicDesigners: defaultGraphicDesigners?.map(m => m?._id || m),
    videoEditors: defaultVideoEditors?.map(m => m?._id || m)
  });

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

  for (let i = 0; i < creativePlan.length; i++) {
    const planItem = creativePlan[i];

    console.log(`\n=== Processing creative plan item ${i + 1} ===`);
    console.log(`Name: ${planItem.name}`);
    console.log(`Creative Type: ${planItem.creativeType}`);
    console.log(`Sub Type: ${planItem.subType}`);
    console.log(`Objective: ${planItem.objective}`);
    console.log(`Assigned Role: ${planItem.assignedRole}`);
    console.log(`Assigned Team Members (raw): ${JSON.stringify(planItem.assignedTeamMembers)}`);
    console.log(`Notes: ${planItem.notes}`);

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

    // Get assigned role and team members from the plan item
    // These were set by the Performance Marketer using the Admin's assignment
    const assignedRole = planItem.assignedRole || (creativeType === 'VIDEO' ? 'video_editor' : 'graphic_designer');

    // Handle assignedTeamMembers - could be array of ObjectIds, strings, or populated user objects
    let assignedTeamMemberIds = planItem.assignedTeamMembers || [];

    // Normalize to array of string IDs
    if (assignedTeamMemberIds && !Array.isArray(assignedTeamMemberIds)) {
      assignedTeamMemberIds = [assignedTeamMemberIds];
    }
    assignedTeamMemberIds = assignedTeamMemberIds
      .filter(id => id != null)
      .map(id => {
        // Handle ObjectId, string, or populated user object
        if (typeof id === 'object' && id._id) {
          return id._id.toString();
        }
        return id.toString ? id.toString() : String(id);
      });

    console.log(`Assigned Role: ${assignedRole}`);
    console.log(`Assigned Team Member IDs (normalized): ${JSON.stringify(assignedTeamMemberIds)}`);

    // Resolve team member IDs to actual user objects
    // The assignedTeamMembers contains user IDs that were set from project.assignedTeam
    let designAssignedTo = null;
    let contentAssignedTo = null;

    // For design/edit task - use the assigned role's team members
    if (assignedRole === 'content_writer') {
      const roleMembers = getTeamMembersForRole('content_writer');
      console.log(`Role members for content_writer:`, roleMembers?.map(m => m?._id || m));
      if (assignedTeamMemberIds.length > 0) {
        // Use the assigned team member IDs directly (they're already user IDs)
        designAssignedTo = assignedTeamMemberIds[0];
        console.log(`Using assignedTeamMember for content_writer: ${designAssignedTo}`);
      } else if (roleMembers && roleMembers.length > 0) {
        designAssignedTo = roleMembers[0]._id || roleMembers[0];
        console.log(`Using default content_writer: ${designAssignedTo}`);
      } else {
        console.log(`No content_writer available for assignment`);
      }
    } else if (assignedRole === 'graphic_designer') {
      const roleMembers = getTeamMembersForRole('graphic_designer');
      console.log(`Role members for graphic_designer:`, roleMembers?.map(m => m?._id || m));
      if (assignedTeamMemberIds.length > 0) {
        designAssignedTo = assignedTeamMemberIds[0];
        console.log(`Using assignedTeamMember for graphic_designer: ${designAssignedTo}`);
      } else if (roleMembers && roleMembers.length > 0) {
        designAssignedTo = roleMembers[0]._id || roleMembers[0];
        console.log(`Using default graphic_designer: ${designAssignedTo}`);
      } else {
        console.log(`No graphic_designer available for assignment`);
      }
    } else if (assignedRole === 'video_editor') {
      const roleMembers = getTeamMembersForRole('video_editor');
      console.log(`Role members for video_editor:`, roleMembers?.map(m => m?._id || m));
      if (assignedTeamMemberIds.length > 0) {
        designAssignedTo = assignedTeamMemberIds[0];
        console.log(`Using assignedTeamMember for video_editor: ${designAssignedTo}`);
      } else if (roleMembers && roleMembers.length > 0) {
        designAssignedTo = roleMembers[0]._id || roleMembers[0];
        console.log(`Using default video_editor: ${designAssignedTo}`);
      } else {
        console.log(`No video_editor available for assignment`);
      }
    }

    // For content task - always use content_writer from project assignment
    if (defaultContentWriters && defaultContentWriters.length > 0) {
      contentAssignedTo = defaultContentWriters[0]._id || defaultContentWriters[0];
      console.log(`Content task assigned to: ${contentAssignedTo}`);
    } else {
      console.log(`No default content_writer available`);
    }

    // Content writing task (first in workflow) - assigned to content_writer
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
    if (contentAssignedTo) {
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