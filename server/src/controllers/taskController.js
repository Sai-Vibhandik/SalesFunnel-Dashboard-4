const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const CreativeStrategy = require('../models/Creative');
const { generateTasksFromStrategy } = require('../services/taskGenerationService');

// Helper to check project access
const checkProjectAccess = async (projectId, user) => {
  const project = await Project.findById(projectId)
    .populate('assignedTeam.performanceMarketer', '_id name')
    .populate('assignedTeam.contentCreator', '_id name')
    .populate('assignedTeam.contentWriter', '_id name')
    .populate('assignedTeam.uiUxDesigner', '_id name')
    .populate('assignedTeam.graphicDesigner', '_id name')
    .populate('assignedTeam.videoEditor', '_id name')
    .populate('assignedTeam.developer', '_id name')
    .populate('assignedTeam.tester', '_id name');

  if (!project) {
    return { project: null, error: { status: 404, message: 'Project not found' } };
  }

  const userId = user._id.toString();
  const isAdmin = user.role === 'admin';
  const isCreator = project.createdBy?.toString() === userId;
  const isAssigned = Object.values(project.assignedTeam || {}).some(
    member => member?._id?.toString() === userId
  );

  if (!isAdmin && !isCreator && !isAssigned) {
    return { project: null, error: { status: 403, message: 'Not authorized to access this project' } };
  }

  return { project, error: null };
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, taskType, assignedTo, assignedRole } = req.query;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    const query = { projectId };
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (assignedTo) query.assignedTo = assignedTo;
    if (assignedRole) query.assignedRole = assignedRole;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('testerReviewedBy', 'name email')
      .populate('marketerApprovedBy', 'name email')
      .populate('testerId', 'name email role')
      .populate('marketerId', 'name email role')
      .populate('parentTaskId', 'taskTitle status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res, next) => {
  try {
    const { status, taskType, projectId } = req.query;

    const query = { assignedTo: req.user._id };
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedBy', 'name email')
      .sort({ priority: -1, dueDate: 1 });

    // Filter out tasks where project was deleted
    const validTasks = tasks.filter(task => task.projectId !== null);

    res.status(200).json({
      success: true,
      count: validTasks.length,
      data: validTasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single task
// @route   GET /api/tasks/:taskId
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('testerReviewedBy', 'name email')
      .populate('marketerApprovedBy', 'name email')
      .populate('testerId', 'name email role')
      .populate('marketerId', 'name email role')
      .populate('parentTaskId', 'taskTitle status');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check access
    const { error } = await checkProjectAccess(task.projectId._id, req.user);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task (manual)
// @route   POST /api/tasks
// @access  Private (Admin or Performance Marketer)
exports.createTask = async (req, res, next) => {
  try {
    const {
      projectId,
      taskType,
      assetType,
      taskTitle,
      assignedTo,
      assignedRole,
      description,
      priority,
      dueDate,
      aiPrompt,
      strategyContext
    } = req.body;

    const { project, error } = await checkProjectAccess(projectId, req.user);
    if (error) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    // Only admin or performance marketer can create tasks
    if (req.user.role !== 'admin' && req.user.role !== 'performance_marketer') {
      return res.status(403).json({
        success: false,
        message: 'Only admins or performance marketers can create tasks'
      });
    }

    // Determine assigned role if not provided
    const role = assignedRole || Task.getRoleForTaskType(taskType);

    const task = await Task.create({
      projectId,
      taskType,
      assetType,
      taskTitle,
      assignedTo: assignedTo || null,
      assignedRole: role,
      assignedBy: req.user._id,
      createdBy: req.user._id,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      aiPrompt,
      strategyContext,
      status: Task.getInitialStatus(taskType)
    });

    // Notify assigned user if any
    if (assignedTo) {
      const projectDisplay = project.projectName || project.businessName;
      await Notification.create({
        recipient: assignedTo,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${taskTitle}" for project "${projectDisplay}"`,
        projectId
      });
    }

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task (start, submit, upload files)
// @route   PUT /api/tasks/:taskId
// @access  Private (Assigned user only)
exports.updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const {
      status, assetUrl, outputFiles, contentOutput, notes,
      // Content creator submission fields
      contentLink, contentFile, contentNotes,
      // Creative task fields
      creativeLink, reviewNotes,
      // Landing page design fields
      designLink, designFile, designNotes,
      // Landing page development fields
      implementationUrl, repoLink, devNotes
    } = req.body;

    const task = await Task.findById(taskId).populate('projectId', '_id projectName businessName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task or is admin
    const isAssigned = task.assignedTo?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned user or admin can update this task'
      });
    }

    const oldStatus = task.status;

    // Update fields
    if (status) {
      // Validate status transitions
      const validTransitions = getValidTransitions(task.status, task.taskType);
      if (!validTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${task.status} to ${status}. Valid transitions: ${validTransitions.join(', ')}`
        });
      }
      task.status = status;

      // Update assignedRole and assignedTo based on status transition
      // When submitted for review, assign to the specific tester
      if (status === 'content_submitted') {
        task.assignedRole = 'tester';
        // Assign to specific tester if available, otherwise the tester role will handle it
        if (task.testerId) {
          task.assignedTo = task.testerId;
        }
      } else if (status === 'design_submitted') {
        task.assignedRole = 'tester';
        if (task.testerId) {
          task.assignedTo = task.testerId;
        }
      } else if (status === 'development_submitted') {
        task.assignedRole = 'tester';
        if (task.testerId) {
          task.assignedTo = task.testerId;
        }
      }
      // When rejected, assign back to original role
      else if (status === 'content_rejected') {
        task.assignedRole = 'content_writer';
        // Re-assign to original content writer (from the task's creator info)
        // The task should be assigned back to whoever created the content
      } else if (status === 'design_rejected') {
        // Assign to appropriate designer based on task type
        if (task.taskType === 'landing_page_design') {
          task.assignedRole = 'ui_ux_designer';
        } else {
          task.assignedRole = 'graphic_designer';
        }
        // The task should be assigned back to the original designer
      }

      // Update timestamps
      if (status === 'in_progress' && !task.startedAt) {
        task.startedAt = new Date();
      }
      if (['submitted', 'content_submitted', 'design_submitted', 'development_submitted'].includes(status)) {
        task.submittedAt = new Date();
      }
      if (status === 'final_approved') {
        task.completedAt = new Date();
      }

      task.addRevision(req.user._id, notes || '', oldStatus, status);
    }

    // If status is changing to content_final_approved, copy content to linked design task
    if (status === 'content_final_approved' && oldStatus !== 'content_final_approved') {
      console.log('\n========== STATUS CHANGE TO CONTENT_FINAL_APPROVED - COPYING TO DESIGN TASK ==========');
      console.log('Content task ID:', task._id);
      console.log('Content task contentLink:', task.contentLink || '(none)');

      try {
        // Find linked design task by parentTaskId
        const videoTypes = ['video_creative', 'ugc_content', 'testimonial_content', 'demo_video', 'reel'];
        const isVideoTask = task.creativeOutputType && videoTypes.includes(task.creativeOutputType);
        const designTaskType = isVideoTask ? 'video_editing' : 'graphic_design';

        const designTask = await Task.findOne({
          parentTaskId: task._id,
          taskType: designTaskType
        });

        if (designTask) {
          console.log('Found linked design task:', designTask._id);
          console.log('Design task type:', designTask.taskType);

          // Copy content fields
          if (task.contentLink) {
            designTask.contentLink = task.contentLink;
            console.log('✓ Copied contentLink');
          }
          if (task.contentFile) {
            designTask.contentFile = task.contentFile;
            console.log('✓ Copied contentFile');
          }
          if (task.contentNotes) {
            designTask.contentNotes = task.contentNotes;
            console.log('✓ Copied contentNotes');
          }
          if (task.contentOutput) {
            designTask.contentOutput = task.contentOutput;
            console.log('✓ Copied contentOutput');
          }

          await designTask.save();
          console.log('✓ Design task saved with copied content');
        } else {
          console.log('No linked design task found for content task:', task._id);
        }
      } catch (copyError) {
        console.error('Error copying content to design task:', copyError);
      }
      console.log('========== END STATUS CHANGE COPY ==========\n');
    }

    if (assetUrl) task.assetUrl = assetUrl;
    if (outputFiles && outputFiles.length > 0) {
      task.outputFiles = [...task.outputFiles, ...outputFiles.map(f => ({
        name: f.name,
        path: f.path,
        publicId: f.publicId,
        uploadedAt: new Date()
      }))];
    }
    if (contentOutput) {
      task.contentOutput = { ...task.contentOutput, ...contentOutput };
    }

    // Handle content creator submission fields
    if (contentLink !== undefined) {
      task.contentLink = contentLink;
    }
    if (contentFile !== undefined) {
      task.contentFile = contentFile;
    }
    if (contentNotes !== undefined) {
      task.contentNotes = contentNotes;
    }

    // If content is being updated and task is already approved, also update linked design task
    if (task.taskType === 'content_creation' && task.status === 'content_final_approved') {
      const hasContentUpdate = contentLink !== undefined || contentFile !== undefined || contentNotes !== undefined || contentOutput !== undefined;

      if (hasContentUpdate) {
        console.log('\n========== CONTENT UPDATE AFTER APPROVAL - SYNCING TO DESIGN TASK ==========');
        console.log('Content task ID:', task._id);

        // Find linked design task
        const linkedDesignTask = await Task.findOne({
          parentTaskId: task._id,
          taskType: { $in: ['graphic_design', 'video_editing'] }
        });

        if (linkedDesignTask) {
          console.log('Found linked design task:', linkedDesignTask._id);
          console.log('Task type:', linkedDesignTask.taskType);
          console.log('Task title:', linkedDesignTask.taskTitle);

          // Sync content fields
          if (contentLink !== undefined) {
            linkedDesignTask.contentLink = contentLink;
            console.log('✓ Synced contentLink to design task');
          }
          if (contentFile !== undefined) {
            linkedDesignTask.contentFile = contentFile;
            console.log('✓ Synced contentFile to design task');
          }
          if (contentNotes !== undefined) {
            linkedDesignTask.contentNotes = contentNotes;
            console.log('✓ Synced contentNotes to design task');
          }
          if (contentOutput !== undefined) {
            linkedDesignTask.contentOutput = { ...linkedDesignTask.contentOutput, ...contentOutput };
            console.log('✓ Synced contentOutput to design task');
          }

          await linkedDesignTask.save();
          console.log('✓ Design task saved with updated content');
        } else {
          console.log('No linked design task found for content task:', task._id);
        }
        console.log('========== END CONTENT SYNC ==========\n');
      }
    }

    // Handle designer submission fields
    if (creativeLink !== undefined) {
      task.creativeLink = creativeLink;
    }
    if (reviewNotes !== undefined) {
      task.reviewNotes = reviewNotes;
    }

    // Handle landing page design submission fields
    if (designLink !== undefined) {
      task.designLink = designLink;
    }
    if (designFile !== undefined) {
      task.designFile = designFile;
    }
    if (designNotes !== undefined) {
      task.designNotes = designNotes;
    }

    // Handle landing page development submission fields
    if (implementationUrl !== undefined) {
      task.implementationUrl = implementationUrl;
    }
    if (repoLink !== undefined) {
      task.repoLink = repoLink;
    }
    if (devNotes !== undefined) {
      task.devNotes = devNotes;
    }

    await task.save();

    // Notify tester when task is submitted
    if (['submitted', 'content_submitted', 'design_submitted', 'development_submitted'].includes(status)) {
      await notifyTesterForReview(task);
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tester review - approve or reject
// @route   PUT /api/tasks/:taskId/tester-review
// @access  Private (Tester only)
exports.testerReview = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { approved, rejectionNote, rejectionReason } = req.body;

    // Verify user is a tester or admin
    if (req.user.role !== 'tester' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only testers or admins can perform this action'
      });
    }

    const task = await Task.findById(taskId)
      .populate('projectId', 'projectName businessName')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task can be reviewed by tester
    if (!task.canBeReviewedByTester()) {
      return res.status(400).json({
        success: false,
        message: 'This task cannot be reviewed by tester in its current status'
      });
    }

    let newStatus;
    let notificationType;
    let notificationMessage;

    if (approved) {
      // Determine next status based on task type and current status
      if (task.status === 'content_submitted') {
        // Content approved by tester - content is finalized, design can start
        // Assign to Designer/Video Editor (NOT Performance Marketer)
        // Marketer will only review the final design/video
        newStatus = 'content_final_approved';

        // Determine which role should receive the design task based on creativeOutputType
        const videoTypes = ['video_creative', 'ugc_content', 'testimonial_content', 'demo_video', 'reel'];
        const isVideoTask = task.creativeOutputType && videoTypes.includes(task.creativeOutputType);

        if (isVideoTask) {
          task.assignedRole = 'video_editor';
        } else {
          task.assignedRole = 'graphic_designer';
        }

        // Assign to the first team member from assignedTeamMembers if available
        if (task.assignedTeamMembers && task.assignedTeamMembers.length > 0) {
          task.assignedTo = task.assignedTeamMembers[0]._id || task.assignedTeamMembers[0];
        }

        notificationMessage = `Your content for "${task.taskTitle}" has been approved and is ready for ${isVideoTask ? 'video editing' : 'design'}.`;
        notificationType = 'content_final_approved';
      } else if (task.taskType === 'landing_page_design' || task.status === 'design_submitted') {
        // Design approved by tester - goes to marketer for final approval
        newStatus = 'design_approved';
        task.assignedRole = 'performance_marketer';
        // Assign to specific marketer if available
        if (task.marketerId) {
          task.assignedTo = task.marketerId;
        }
        notificationMessage = `Your design for "${task.projectId?.projectName || task.projectId?.businessName || 'the project'}" has been approved by the tester and is awaiting marketer review.`;
        notificationType = 'task_approved_by_tester';
      } else if (task.taskType === 'landing_page_development' || task.status === 'development_submitted') {
        // Development approved by tester - goes to marketer for final approval
        newStatus = 'development_approved';
        task.assignedRole = 'performance_marketer';
        // Assign to specific marketer if available
        if (task.marketerId) {
          task.assignedTo = task.marketerId;
        }
        notificationMessage = `Your development work for "${task.projectId?.projectName || task.projectId?.businessName || 'the project'}" has been approved by the tester and is awaiting marketer review.`;
        notificationType = 'task_approved_by_tester';
      } else {
        // Legacy workflow
        newStatus = 'approved_by_tester';
        task.assignedRole = 'performance_marketer';
        if (task.marketerId) {
          task.assignedTo = task.marketerId;
        }
        notificationMessage = `Your task "${task.taskTitle}" has been approved by the tester and is now awaiting marketer review.`;
        notificationType = 'task_approved_by_tester';
      }
    } else {
      // Rejected - determine the rejection status
      if (task.status === 'content_submitted') {
        newStatus = 'content_rejected';
        task.assignedRole = 'content_writer';
      } else if (task.status === 'design_submitted') {
        newStatus = 'design_rejected';
        // Assign back to the appropriate designer based on task type
        if (task.taskType === 'landing_page_design') {
          task.assignedRole = 'ui_ux_designer';
        } else {
          task.assignedRole = 'graphic_designer';
        }
      } else if (task.status === 'development_submitted') {
        newStatus = 'development_pending';
        task.assignedRole = 'developer';
      } else {
        newStatus = 'rejected';
        task.assignedRole = Task.getRoleForTaskType(task.taskType);
      }
      notificationType = 'task_rejected';
      notificationMessage = `Your task "${task.taskTitle}" has been rejected. Please review the feedback and resubmit.`;
    }

    task.status = newStatus;
    task.testerReviewedBy = req.user._id;
    task.testerReviewedAt = new Date();

    if (!approved) {
      task.rejectionNote = rejectionNote;
      task.rejectionReason = rejectionReason;
    }

    task.addRevision(req.user._id, approved ? 'Approved by tester' : `Rejected: ${rejectionNote}`, task.status, newStatus);

    await task.save();

    // Notify assigned user
    if (task.assignedTo) {
      await Notification.create({
        recipient: task.assignedTo._id || task.assignedTo,
        type: notificationType,
        title: approved ? 'Task Approved by Tester' : 'Task Rejected',
        message: notificationMessage,
        projectId: task.projectId?._id || task.projectId
      });
    }

    // If content is finalized, find the paired design task and copy the approved content
    // Note: Content goes directly to designer after tester approval, NOT to marketer
    // Marketer will only be notified after design/video approval
    if (approved && newStatus === 'content_final_approved') {
      try {
        // Content is finalized - find the paired design task and copy the approved content
        console.log('\n========== CONTENT APPROVAL - COPYING TO DESIGN TASK ==========');
        console.log('Content task ID:', task._id);
        console.log('Content task type:', task.taskType);
        console.log('Content task creativeOutputType:', task.creativeOutputType);
        console.log('Content task adTypeKey:', task.adTypeKey);
        console.log('Content task creativeStrategyId:', task.creativeStrategyId);
        console.log('Content task projectId:', task.projectId?._id || task.projectId);

        // Log content fields from the content task
        console.log('\n--- Content Task Fields ---');
        console.log('contentLink:', task.contentLink || '(none)');
        console.log('contentFile:', task.contentFile ? JSON.stringify(task.contentFile) : '(none)');
        console.log('contentNotes:', task.contentNotes ? `"${task.contentNotes?.substring(0, 50) || ''}..."` : '(none)');
        console.log('contentOutput:', task.contentOutput ? JSON.stringify({
          headline: task.contentOutput.headline || '(none)',
          bodyText: task.contentOutput.bodyText ? '(present)' : '(none)',
          cta: task.contentOutput.cta || '(none)',
          script: task.contentOutput.script ? '(present)' : '(none)'
        }) : '(empty)');

        // Find the paired design task based on creativeStrategyId and adTypeKey/creativeOutputType
        const videoTypes = ['video_creative', 'ugc_content', 'testimonial_content', 'demo_video', 'reel'];
        const isVideoTask = task.creativeOutputType && videoTypes.includes(task.creativeOutputType);
        const designTaskType = isVideoTask ? 'video_editing' : 'graphic_design';

        console.log('\n--- Design Task Search ---');
        console.log('Is video task:', isVideoTask);
        console.log('Design task type to find:', designTaskType);

        const projectId = task.projectId._id || task.projectId;
        let designTask = null;

        // First, try to find design task by parentTaskId pointing to this content task
        // This is the primary way to link content task to design task
        console.log('\nStrategy 1: Search by parentTaskId...');
        designTask = await Task.findOne({
          projectId: projectId,
          taskType: designTaskType,
          parentTaskId: task._id
        });
        console.log('Result:', designTask ? `Found design task ${designTask._id}` : 'Not found');

        // If not found by parentTaskId, try to find by creativeStrategyId and adTypeKey
        // Remove status requirement - design task might be in any status
        if (!designTask && task.creativeStrategyId) {
          console.log('\nStrategy 2: Search by creativeStrategyId and adTypeKey...');
          const query = {
            projectId: projectId,
            taskType: designTaskType,
            creativeStrategyId: task.creativeStrategyId
          };
          if (task.adTypeKey) {
            query.adTypeKey = task.adTypeKey;
          }
          console.log('Query:', JSON.stringify(query));
          designTask = await Task.findOne(query);
          console.log('Result:', designTask ? `Found design task ${designTask._id}` : 'Not found');
        }

        // If still not found, try to find by matching creativeOutputType
        if (!designTask) {
          console.log('\nStrategy 3: Search by creativeOutputType...');
          const query = {
            projectId: projectId,
            taskType: designTaskType,
            creativeOutputType: task.creativeOutputType
          };
          console.log('Query:', JSON.stringify(query));
          designTask = await Task.findOne(query);
          console.log('Result:', designTask ? `Found design task ${designTask._id}` : 'Not found');
        }

        // Last resort: find by assetType match
        if (!designTask && task.assetType) {
          console.log('\nStrategy 4: Search by assetType...');
          const query = {
            projectId: projectId,
            taskType: designTaskType
          };
          if (isVideoTask) {
            query.assetType = { $in: ['video_creative', 'video_creative_content', 'ugc_content', 'testimonial_content', 'demo_video'] };
          } else {
            query.assetType = { $in: ['image_creative', 'carousel_creative', 'image_creative_content', 'carousel_creative_content'] };
          }
          console.log('Query:', JSON.stringify(query));
          designTask = await Task.findOne(query);
          console.log('Result:', designTask ? `Found design task ${designTask._id}` : 'Not found');
        }

        // Final fallback: just find any design task of the right type for this project
        if (!designTask) {
          console.log('\nStrategy 5: Final fallback - find any design task of this type...');
          const query = {
            projectId: projectId,
            taskType: designTaskType
          };
          console.log('Query:', JSON.stringify(query));
          designTask = await Task.findOne(query);
          console.log('Result:', designTask ? `Found design task ${designTask._id}` : 'Not found');
        }

        if (designTask) {
          // Copy the approved content to the design task
          console.log('\n--- Copying Content to Design Task ---');
          console.log('Design task ID:', designTask._id);
          console.log('Design task title:', designTask.taskTitle);
          console.log('Design task status:', designTask.status);
          console.log('Design task assignedTo:', designTask.assignedTo?._id || designTask.assignedTo || '(none)');

          // Log what we're about to copy
          console.log('Content to copy:');
          console.log('  - contentLink:', task.contentLink || '(empty)');
          console.log('  - contentFile:', task.contentFile ? JSON.stringify(task.contentFile) : '(empty)');
          console.log('  - contentNotes:', task.contentNotes ? `"${task.contentNotes?.substring(0, 100) || ''}..."` : '(empty)');
          console.log('  - contentOutput:', task.contentOutput ? JSON.stringify({
            headline: task.contentOutput.headline || '(none)',
            bodyText: task.contentOutput.bodyText ? '(present)' : '(none)',
            cta: task.contentOutput.cta || '(none)',
            script: task.contentOutput.script ? '(present)' : '(none)'
          }) : '(empty)');

          // Copy the content fields
          designTask.contentLink = task.contentLink || null;
          designTask.contentFile = task.contentFile || null;
          designTask.contentNotes = task.contentNotes || null;
          designTask.contentOutput = task.contentOutput || null;

          // Also copy strategy context for reference
          if (task.strategyContext) {
            designTask.strategyContext = {
              ...designTask.strategyContext,
              // Preserve design-specific context but add content info
              approvedContentLink: task.contentLink,
              approvedContentNotes: task.contentNotes
            };
          }

          await designTask.save();
          console.log('✓ Successfully saved design task with copied content');

          // Verify the save worked
          const verifyTask = await Task.findById(designTask._id);
          console.log('Verification - design task contentLink:', verifyTask.contentLink || '(empty)');
          console.log('Verification - design task contentFile:', verifyTask.contentFile ? '(present)' : '(empty)');
          console.log('Verification - design task contentNotes:', verifyTask.contentNotes ? '(present)' : '(empty)');

          // Notify the assigned designer/editor
          if (designTask.assignedTo) {
            await Notification.create({
              recipient: designTask.assignedTo._id || designTask.assignedTo,
              type: 'content_approved',
              title: 'Approved Content Ready',
              message: `The content for "${task.taskTitle}" has been approved and is ready for ${isVideoTask ? 'video editing' : 'design'}. You can now view the approved content.`,
              projectId: task.projectId._id || task.projectId
            });
            console.log('✓ Notification sent to assigned designer/editor');
          }
        } else {
          console.log('\n⚠ WARNING: No paired design task found for content task');
          console.log('This means the approved content will NOT be available to the designer/editor.');
          console.log('Content task:', task._id);
          console.log('creativeOutputType:', task.creativeOutputType);
          console.log('adTypeKey:', task.adTypeKey);
          console.log('projectId:', projectId);
          console.log('creativeStrategyId:', task.creativeStrategyId);

          // List all design tasks for this project for debugging
          const allDesignTasks = await Task.find({
            projectId: projectId,
            taskType: { $in: ['graphic_design', 'video_editing'] }
          }).select('_id taskType taskTitle status creativeOutputType adTypeKey creativeStrategyId parentTaskId');

          console.log('\nAll design tasks for this project:');
          allDesignTasks.forEach(dt => {
            console.log(`  - ${dt._id}: ${dt.taskType} "${dt.taskTitle}" status=${dt.status} creativeOutputType=${dt.creativeOutputType} adTypeKey=${dt.adTypeKey} parentTaskId=${dt.parentTaskId || '(none)'}`);
          });
        }
        console.log('========== END CONTENT APPROVAL ==========\n');
      } catch (contentCopyError) {
        console.error('❌ ERROR copying content to design task:', contentCopyError);
        // Don't throw - the approval should still succeed even if content copy fails
        // The migration script can fix this later
      }
    }

    // If landing page design is approved, notify developer
    if (approved && (task.taskType === 'landing_page_design' || task.status === 'design_approved')) {
      if (!task.projectId) {
        console.warn('Task missing projectId during landing page design approval');
      } else {
        const project = await Project.findById(task.projectId._id || task.projectId)
          .populate('assignedTeam.developers', '_id name')
          .populate('assignedTeam.developer', '_id name');

        let developmentTask = await Task.findOne({
          projectId: task.projectId._id || task.projectId,
          taskType: 'landing_page_development',
          landingPageId: task.landingPageId
        });

        if (developmentTask) {
          developmentTask.designLink = task.designLink;
          developmentTask.designFile = task.designFile;
          developmentTask.designNotes = task.designNotes;
          await developmentTask.save();
        }

        // Get developer from project or task
        let developerId = developmentTask?.assignedTo;

        if (!developerId && project?.assignedTeam?.developers?.length > 0) {
          developerId = project.assignedTeam.developers[0]._id;
        } else if (!developerId && project?.assignedTeam?.developer) {
          developerId = project.assignedTeam.developer._id;
        }

        if (developerId) {
          await Notification.create({
            recipient: developerId,
            type: 'task_assigned',
            title: 'Landing Page Ready for Development',
            message: `The landing page design for "${project?.projectName || project?.businessName || 'a project'}" is approved and ready for development.`,
            projectId: task.projectId._id || task.projectId
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Performance Marketer review - approve or reject
// @route   PUT /api/tasks/:taskId/marketer-review
// @access  Private (Performance Marketer or Admin)
exports.marketerReview = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { approved, rejectionNote, rejectionReason } = req.body;

    // Verify user is a performance marketer or admin
    if (req.user.role !== 'performance_marketer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only performance marketers or admins can perform this action'
      });
    }

    const task = await Task.findById(taskId)
      .populate('projectId', 'projectName businessName')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task can be reviewed by marketer
    if (!task.canBeApprovedByMarketer()) {
      return res.status(400).json({
        success: false,
        message: 'This task must be approved by tester first before marketer review'
      });
    }

    let newStatus;
    let notificationType;
    let notificationMessage;

    if (approved) {
      // Determine next status based on current status and task type
      // Note: Marketer only approves design/video, NOT content
      // Content goes directly from tester to designer after content_final_approved
      if (task.status === 'design_approved') {
        // Design approved - check task type for next step
        if (task.taskType === 'landing_page_design') {
          // Landing page design approved - move to development phase
          newStatus = 'development_pending';
          task.assignedRole = 'developer';
          notificationMessage = `Your design for "${task.taskTitle}" has been approved by the marketer. It's now ready for development.`;
          notificationType = 'design_approved_for_development';
        } else {
          // Creative design approved - task complete
          newStatus = 'final_approved';
          notificationMessage = `Your design for "${task.taskTitle}" has been fully approved and is ready for deployment.`;
          notificationType = 'task_approved_by_marketer';
        }
      } else if (task.status === 'development_approved') {
        // Landing page development approved - task complete
        newStatus = 'final_approved';
        notificationMessage = `Your development work for "${task.taskTitle}" has been fully approved and is ready for deployment.`;
        notificationType = 'task_approved_by_marketer';
      } else {
        // Legacy workflow - final approval
        newStatus = 'final_approved';
        notificationMessage = `Your task "${task.taskTitle}" has been fully approved and is ready for deployment.`;
        notificationType = 'task_approved_by_marketer';
      }
    } else {
      // Rejected - determine rejection status based on task type and status
      if (task.status === 'design_approved') {
        if (task.taskType === 'landing_page_design') {
          newStatus = 'design_rejected';
          task.assignedRole = 'ui_ux_designer';
        } else {
          newStatus = 'design_rejected';
          task.assignedRole = 'graphic_designer';
        }
      } else if (task.status === 'development_approved') {
        newStatus = 'development_pending';
        task.assignedRole = 'developer';
      } else {
        newStatus = 'rejected';
        task.assignedRole = Task.getRoleForTaskType(task.taskType);
      }
      notificationType = 'task_rejected';
      notificationMessage = `Your task "${task.taskTitle}" has been rejected by the performance marketer. Please review the feedback and resubmit.`;
    }

    task.status = newStatus;
    task.marketerApprovedBy = approved ? req.user._id : null;
    task.marketerApprovedAt = approved ? new Date() : null;

    if (!approved) {
      task.rejectionNote = rejectionNote;
      task.rejectionReason = rejectionReason;
    }

    task.addRevision(req.user._id, approved ? 'Approved by marketer' : `Rejected: ${rejectionNote}`, task.status, newStatus);

    await task.save();

    // Notify assigned user
    if (task.assignedTo) {
      await Notification.create({
        recipient: task.assignedTo._id || task.assignedTo,
        type: notificationType,
        title: approved ? (task.status === 'content_final_approved' ? 'Content Approved - Ready for Design' : 'Task Fully Approved') : 'Task Rejected',
        message: notificationMessage,
        projectId: task.projectId?._id || task.projectId
      });
    }

    // If content is approved, find paired design task and notify the correct designer/editor
    if (approved && newStatus === 'content_final_approved') {
      if (!task.projectId) {
        console.warn('Task missing projectId during content final approval');
      } else {
        const project = await Project.findById(task.projectId._id || task.projectId)
          .populate('assignedTeam.graphicDesigners', '_id name')
          .populate('assignedTeam.videoEditors', '_id name')
          .populate('assignedTeam.graphicDesigner', '_id name')
          .populate('assignedTeam.videoEditor', '_id name');

        // Determine which role should receive the design task based on creativeOutputType
        const videoTypes = ['video_creative', 'ugc_content', 'testimonial_content', 'demo_video', 'reel'];
        const isVideoTask = task.creativeOutputType && videoTypes.includes(task.creativeOutputType);
        const targetRole = isVideoTask ? 'video_editor' : 'graphic_designer';

        // Get team member from project (try array fields first, then legacy fields)
        let targetTeamMember = null;
        if (isVideoTask) {
          targetTeamMember = project?.assignedTeam?.videoEditors?.[0] || project?.assignedTeam?.videoEditor;
        } else {
          targetTeamMember = project?.assignedTeam?.graphicDesigners?.[0] || project?.assignedTeam?.graphicDesigner;
        }

        // Find the paired design task based on creativeId, adTypeKey, or task title matching
        let designTaskQuery = {
          projectId: task.projectId._id || task.projectId,
          taskType: isVideoTask ? 'video_editing' : 'graphic_design',
          status: 'design_pending'
        };

        // Try to find by creativeStrategyId and adTypeKey if available
        if (task.creativeStrategyId && task.adTypeKey) {
          designTaskQuery.creativeStrategyId = task.creativeStrategyId;
          designTaskQuery.adTypeKey = task.adTypeKey;
        } else if (task.creativeStrategyId) {
          designTaskQuery.creativeStrategyId = task.creativeStrategyId;
          // Find matching design task by creativeOutputType or asset type
          if (isVideoTask) {
            designTaskQuery.assetType = { $in: ['video_creative', 'ugc_content', 'testimonial_content', 'demo_video'] };
          } else {
            designTaskQuery.assetType = { $in: ['image_creative', 'carousel_creative', 'offer_creative'] };
          }
        }

        const designTask = await Task.findOne(designTaskQuery);

        if (designTask && targetTeamMember) {
          // Update design task status and assignment
          designTask.assignedTo = targetTeamMember._id || targetTeamMember;
          designTask.assignedRole = targetRole;
          await designTask.save();

          // Notify the designer/editor
          await Notification.create({
            recipient: targetTeamMember._id || targetTeamMember,
            type: 'task_assigned',
            title: 'New Design Task Ready',
            message: `Content for "${task.taskTitle}" is approved and ready for ${isVideoTask ? 'video editing' : 'design'}.`,
            projectId: task.projectId._id || task.projectId
          });
        } else if (targetTeamMember) {
          // No matching design task found, but still notify the designer
          await Notification.create({
            recipient: targetTeamMember._id || targetTeamMember,
            type: 'task_assigned',
            title: 'New Design Task',
            message: `Content for "${task.projectId?.projectName || task.projectId?.businessName || 'a project'}" is approved and ready for ${isVideoTask ? 'video editing' : 'design'}.`,
            projectId: task.projectId._id || task.projectId
          });
        }
      }
    }

    // If landing page design is approved by marketer, notify developer
    if (approved && newStatus === 'development_pending' && task.taskType === 'landing_page_design') {
      if (!task.projectId) {
        console.warn('Task missing projectId during landing page design approval');
      } else {
        const project = await Project.findById(task.projectId._id || task.projectId)
          .populate('assignedTeam.developers', '_id name')
          .populate('assignedTeam.developer', '_id name');

        // Find the development task for this landing page and activate it
        const developmentTask = await Task.findOne({
          projectId: task.projectId._id || task.projectId,
          landingPageId: task.landingPageId,
          taskType: 'landing_page_development'
        });

        if (developmentTask) {
          // Copy design details to development task
          developmentTask.designLink = task.designLink;
          developmentTask.designFile = task.designFile;
          developmentTask.designNotes = task.designNotes;
          await developmentTask.save();
        }

        // Get developer from project (try array fields first, then legacy fields)
        let developerId = developmentTask?.assignedTo;

        if (!developerId && project?.assignedTeam?.developers?.length > 0) {
          developerId = project.assignedTeam.developers[0]._id;
        } else if (!developerId && project?.assignedTeam?.developer) {
          developerId = project.assignedTeam.developer._id;
        }

        if (developerId) {
          await Notification.create({
            recipient: developerId,
            type: 'task_assigned',
            title: 'Landing Page Ready for Development',
            message: `The design for "${task.projectId?.projectName || task.projectId?.businessName || 'a project'}" has been approved and is ready for development.`,
            projectId: task.projectId._id || task.projectId
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign task to a user
// @route   PUT /api/tasks/:taskId/assign
// @access  Private (Admin or Performance Marketer)
exports.assignTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { assignedTo, assignedRole } = req.body;

    // Only admin or performance marketer can assign tasks
    if (req.user.role !== 'admin' && req.user.role !== 'performance_marketer') {
      return res.status(403).json({
        success: false,
        message: 'Only admins or performance marketers can assign tasks'
      });
    }

    const task = await Task.findById(taskId).populate('projectId', '_id projectName businessName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldAssignee = task.assignedTo;
    task.assignedTo = assignedTo || null;
    if (assignedRole) task.assignedRole = assignedRole;
    task.addRevision(req.user._id, 'Task reassigned', task.status, task.status);

    await task.save();

    // Notify new assignee
    if (assignedTo) {
      const projectDisplay = task.projectId.projectName || task.projectId.businessName;
      await Notification.create({
        recipient: assignedTo,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned to task: "${task.taskTitle}" for project "${projectDisplay}"`,
        projectId: task.projectId._id
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload files to task
// @route   POST /api/tasks/:taskId/files
// @access  Private (Assigned user only)
exports.uploadFiles = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to this task
    if (task.assignedTo?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned user can upload files'
      });
    }

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        name: file.originalname,
        path: file.path,
        publicId: file.filename || file.publicId,
        uploadedAt: new Date()
      }));

      task.outputFiles = [...task.outputFiles, ...newFiles];
      await task.save();
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks pending review (for testers)
// @route   GET /api/tasks/pending-review
// @access  Private (Tester or Admin)
exports.getPendingReviewTasks = async (req, res, next) => {
  try {
    // Only testers and admins can access
    if (req.user.role !== 'tester' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only testers or admins can view pending reviews'
      });
    }

    const pendingStatuses = [
      'submitted',
      'content_submitted',
      'design_submitted',
      'development_submitted'
    ];

    const tasks = await Task.find({
      status: { $in: pendingStatuses }
    })
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .sort({ submittedAt: 1 });

    // Filter out tasks where project was deleted
    const validTasks = tasks.filter(task => task.projectId !== null);

    res.status(200).json({
      success: true,
      count: validTasks.length,
      data: validTasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks pending marketer approval
// @route   GET /api/tasks/pending-marketer-approval
// @access  Private (Performance Marketer or Admin)
exports.getPendingMarketerApproval = async (req, res, next) => {
  try {
    // Only performance marketers and admins can access
    if (req.user.role !== 'performance_marketer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only performance marketers or admins can view pending approvals'
      });
    }

    // Get projects where user is assigned as performance marketer
    const projects = await Project.find({
      'assignedTeam.performanceMarketer': req.user._id
    }).select('_id');

    const projectIds = projects.map(p => p._id);

    const pendingStatuses = [
      'approved_by_tester',
      'content_approved',
      'design_approved',
      'development_approved'
    ];

    const tasks = await Task.find({
      projectId: { $in: projectIds },
      status: { $in: pendingStatuses }
    })
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .populate('testerReviewedBy', 'name email')
      .sort({ testerReviewedAt: 1 });

    // Filter out tasks where project was deleted
    const validTasks = tasks.filter(task => task.projectId !== null);

    res.status(200).json({
      success: true,
      count: validTasks.length,
      data: validTasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get approved assets (tasks approved by tester or marketer)
// @route   GET /api/tasks/approved-assets
// @access  Private (Tester, Admin, Performance Marketer)
exports.getApprovedAssets = async (req, res, next) => {
  try {
    // Get tasks that have been approved by tester or are fully approved
    // These are tasks in: approved_by_tester, content_approved, design_approved, development_approved, final_approved
    const approvedStatuses = [
      'approved_by_tester',
      'content_approved',
      'design_approved',
      'development_approved',
      'final_approved',
      'content_final_approved'
    ];

    const tasks = await Task.find({
      status: { $in: approvedStatuses }
    })
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .populate('testerReviewedBy', 'name email')
      .populate('marketerApprovedBy', 'name email')
      .sort({ testerReviewedAt: -1, updatedAt: -1 });

    // Filter out tasks where project was deleted
    const validTasks = tasks.filter(task => task.projectId !== null);

    res.status(200).json({
      success: true,
      count: validTasks.length,
      data: validTasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get completed assets for a specific project
// @route   GET /api/tasks/project/:projectId/completed
// @access  Private (requires project access)
exports.getProjectCompletedAssets = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get completed/approved statuses
    const completedStatuses = [
      'approved_by_tester',
      'content_approved',
      'design_approved',
      'development_approved',
      'final_approved',
      'content_final_approved'
    ];

    const tasks = await Task.find({
      projectId,
      status: { $in: completedStatuses }
    })
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .populate('testerReviewedBy', 'name email')
      .populate('marketerApprovedBy', 'name email')
      .sort({ updatedAt: -1 });

    // Group tasks by type
    const groupedTasks = {
      creatives: tasks.filter(t => ['graphic_design', 'video_editing'].includes(t.taskType)),
      landingPages: tasks.filter(t => ['landing_page_design', 'landing_page_development'].includes(t.taskType)),
      content: tasks.filter(t => t.taskType === 'content_creation'),
      other: tasks.filter(t => !['graphic_design', 'video_editing', 'landing_page_design', 'landing_page_development', 'content_creation'].includes(t.taskType))
    };

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: {
        project: {
          _id: project._id,
          projectName: project.projectName,
          businessName: project.businessName,
          industry: project.industry
        },
        tasks,
        groupedTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate tasks for a project (trigger manually)
// @route   POST /api/tasks/generate/:projectId
// @access  Private (Admin only)
exports.generateTasks = async (req, res, next) => {
  try {
    // Only admin can trigger manual task generation
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can manually generate tasks'
      });
    }

    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if creative strategy is completed
    if (!project.stages.creativeStrategy.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Creative strategy must be completed before generating tasks'
      });
    }

    // Get creative strategy
    const creativeStrategy = await CreativeStrategy.findOne({ projectId });

    if (!creativeStrategy) {
      return res.status(404).json({
        success: false,
        message: 'Creative strategy not found'
      });
    }

    // Generate tasks
    const tasks = await generateTasksFromStrategy(projectId, creativeStrategy, req.user._id);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
      message: `Successfully generated ${tasks.length} tasks for the project`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks (for PM/admin)
// @route   GET /api/tasks
// @access  Private (admin, performance_marketer)
exports.getAllTasks = async (req, res, next) => {
  try {
    const { status, taskType, projectId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    // Filter out tasks where project was deleted
    const validTasks = tasks.filter(task => task.projectId !== null);

    res.status(200).json({
      success: true,
      count: validTasks.length,
      data: validTasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task content output
// @route   PUT /api/tasks/:taskId/content
// @access  Private (assigned user)
exports.updateTaskContent = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { headline, bodyText, cta, script, notes } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify ownership
    if (task.assignedTo?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Update content output
    task.contentOutput = {
      headline: headline || task.contentOutput?.headline,
      bodyText: bodyText || task.contentOutput?.bodyText,
      cta: cta || task.contentOutput?.cta,
      script: script || task.contentOutput?.script,
      notes: notes || task.contentOutput?.notes
    };

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available team members for assignment
// @route   GET /api/tasks/team-members
// @access  Private
exports.getTeamMembers = async (req, res, next) => {
  try {
    const { role } = req.query;

    const query = { isActive: true };
    if (role) query.role = role;

    const users = await User.find(query)
      .select('name email role specialization availability');

    // Group by role
    const grouped = {
      contentWriters: users.filter(u => u.role === 'content_writer'),
      graphicDesigners: users.filter(u => u.role === 'graphic_designer'),
      videoEditors: users.filter(u => u.role === 'video_editor'),
      uiUxDesigners: users.filter(u => u.role === 'ui_ux_designer'),
      developers: users.filter(u => u.role === 'developer'),
      testers: users.filter(u => u.role === 'tester'),
      performanceMarketers: users.filter(u => u.role === 'performance_marketer')
    };

    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks by role (for dashboard view)
// @route   GET /api/tasks/by-role/:role
// @access  Private
exports.getTasksByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { status, projectId } = req.query;

    // Validate role
    const validRoles = [
      'content_writer', 'graphic_designer', 'video_editor',
      'ui_ux_designer', 'developer', 'tester', 'performance_marketer'
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`
      });
    }

    // For testers, get tasks submitted for review
    // For performance marketers, get tasks pending their approval
    // For other roles, get tasks assigned to them

    let query = {};

    // Role-specific status filters
    if (role === 'tester') {
      // Testers see tasks that are submitted for review AND assigned to them specifically
      query.status = { $in: ['content_submitted', 'design_submitted', 'development_submitted'] };
      // Filter by the specific tester assigned to this task
      query.testerId = req.user._id;
    } else if (role === 'performance_marketer') {
      // Performance marketers see tasks pending their approval AND assigned to them specifically
      query.status = { $in: ['content_approved', 'design_approved', 'development_approved'] };
      // Filter by the specific marketer assigned to this task
      query.marketerId = req.user._id;
    } else {
      // Other roles see their assigned tasks
      query.assignedRole = role;
      query.assignedTo = req.user._id;
      if (status) query.status = status;
    }

    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks for current user's role
// @route   GET /api/tasks/my-role-tasks
// @access  Private
exports.getMyRoleTasks = async (req, res, next) => {
  try {
    const { status, projectId } = req.query;
    const userRole = req.user.role;

    // Map user role to task assignedRole
    const roleMap = {
      'content_writer': 'content_writer',
      'graphic_designer': 'graphic_designer',
      'video_editor': 'video_editor',
      'ui_ux_designer': 'ui_ux_designer',
      'developer': 'developer',
      'tester': 'tester',
      'performance_marketer': 'performance_marketer'
    };

    const assignedRole = roleMap[userRole];
    if (!assignedRole) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    let query = {};

    // Role-specific status filters
    if (assignedRole === 'tester') {
      // Testers see tasks that are submitted for review AND assigned to them specifically
      query.status = { $in: ['content_submitted', 'design_submitted', 'development_submitted'] };
      query.testerId = req.user._id;
    } else if (assignedRole === 'performance_marketer') {
      // Performance marketers see tasks pending their approval AND assigned to them specifically
      query.status = { $in: ['content_approved', 'design_approved', 'development_approved'] };
      query.marketerId = req.user._id;
    } else {
      // For creators, designers, developers - show their assigned tasks
      query.assignedRole = assignedRole;
      query.assignedTo = req.user._id;
      const statuses = {
        content_writer: ['content_pending', 'content_rejected'],
        graphic_designer: ['design_pending', 'design_rejected'],
        video_editor: ['design_pending', 'design_rejected'],
        ui_ux_designer: ['design_pending', 'design_rejected'],
        developer: ['development_pending']
      };
      if (status) {
        query.status = status;
      } else if (statuses[assignedRole]) {
        query.status = { $in: statuses[assignedRole] };
      }
    }

    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate('projectId', 'projectName businessName industry')
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    // Filter out tasks where project was deleted (projectId will be null after populate)
    const validTasks = tasks.filter(task => task.projectId !== null);

    res.status(200).json({
      success: true,
      count: validTasks.length,
      data: validTasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get creative tasks for the current user from CreativeStrategy
// @route   GET /api/tasks/my-creative-tasks
// @access  Private
exports.getMyCreativeTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    console.log('\n=== getMyCreativeTasks ===');
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    // Map user role to assignedRole in creativePlan
    const roleMap = {
      'content_writer': 'content_writer',
      'graphic_designer': 'graphic_designer',
      'video_editor': 'video_editor'
    };

    const assignedRole = roleMap[userRole];
    if (!assignedRole) {
      console.log('Role not supported for creative tasks:', userRole);
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Find all CreativeStrategy documents
    const strategies = await CreativeStrategy.find()
      .populate('projectId', 'projectName businessName industry');

    console.log(`Found ${strategies.length} creative strategies`);

    const tasks = [];
    const mongoose = require('mongoose');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    strategies.forEach(strategy => {
      // Skip if project was deleted
      if (!strategy.projectId) return;

      const creativePlan = strategy.creativePlan || [];

      creativePlan.forEach((creative, index) => {
        // Check if this creative is assigned to the current user
        const isAssignedToUser = creative.assignedTeamMembers?.some(memberId => {
          // Handle both ObjectId and string comparisons
          const memberIdStr = memberId?._id?.toString() || memberId?.toString();
          return memberIdStr === userId.toString();
        });

        // Also check if the role matches
        const roleMatches = creative.assignedRole === assignedRole;

        if (isAssignedToUser && roleMatches) {
          tasks.push({
            _id: `${strategy._id}_${creative._id || index}`,
            projectId: strategy.projectId,
            creativeStrategyId: strategy._id,
            creativeName: creative.name || `Creative ${index + 1}`,
            creativeType: creative.creativeType,
            subType: creative.subType,
            objective: creative.objective,
            platforms: creative.platforms || [],
            screenSizes: creative.screenSizes || [],
            assignedRole: creative.assignedRole,
            assignedTeamMembers: creative.assignedTeamMembers,
            notes: creative.notes,
            taskType: 'content_generation',
            status: 'pending'
          });
        }
      });
    });

    console.log(`Found ${tasks.length} creative tasks for user ${userId}`);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error in getMyCreativeTasks:', error);
    next(error);
  }
};

// Helper function to get valid status transitions
function getValidTransitions(currentStatus, taskType) {
  // Landing page design has a different workflow - goes to development after approval
  if (taskType === 'landing_page_design') {
    const landingPageDesignTransitions = {
      design_pending: ['design_submitted'],
      design_submitted: ['design_approved', 'design_rejected'],
      design_approved: ['development_pending', 'design_rejected'], // Marketer can send to development
      design_rejected: ['design_submitted']
    };
    return landingPageDesignTransitions[currentStatus] || [];
  }

  // Landing page development workflow
  if (taskType === 'landing_page_development') {
    const landingPageDevTransitions = {
      development_pending: ['development_submitted'],
      development_submitted: ['development_approved', 'development_pending'], // Reject goes back to pending
      development_approved: ['final_approved', 'development_pending'] // Marketer approves to final, or rejects
    };
    return landingPageDevTransitions[currentStatus] || [];
  }

  const transitions = {
    // Standard creative workflow
    todo: ['in_progress'],
    in_progress: ['submitted'],
    submitted: ['approved_by_tester', 'rejected'],
    approved_by_tester: ['final_approved', 'rejected'],
    rejected: ['in_progress', 'submitted'],
    final_approved: [],

    // Content creation workflow
    content_pending: ['content_submitted'],
    content_submitted: ['content_final_approved', 'content_rejected'], // Tester approves directly to design (skip marketer)
    content_approved: ['content_final_approved', 'content_rejected'], // Legacy - marketer approval (not used in new flow)
    content_rejected: ['content_submitted'],
    content_final_approved: ['design_pending'],

    // Design workflow (for graphic design/video tasks after content approval)
    design_pending: ['design_submitted'],
    design_submitted: ['design_approved', 'design_rejected'],
    design_approved: ['final_approved', 'design_rejected'],
    design_rejected: ['design_submitted'],

    // Landing page development (fallback)
    development_pending: ['development_submitted'],
    development_submitted: ['development_approved', 'development_pending'],
    development_approved: ['final_approved', 'rejected']
  };

  return transitions[currentStatus] || [];
}

// Helper function to notify tester for review
async function notifyTesterForReview(task) {
  const project = await Project.findById(task.projectId)
    .populate('assignedTeam.tester', '_id name');

  if (project.assignedTeam.tester) {
    await Notification.create({
      recipient: project.assignedTeam.tester._id,
      type: 'task_submitted',
      title: 'Task Ready for Review',
      message: `A task "${task.taskTitle}" has been submitted and is ready for your review.`,
      projectId: task.projectId
    });
  }
}