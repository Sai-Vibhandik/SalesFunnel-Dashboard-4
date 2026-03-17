const mongoose = require('mongoose');

// Task types for different production workflows
const TASK_TYPES = [
  'content_creation',
  'graphic_design',
  'video_editing',
  'landing_page_design',
  'landing_page_development'
];

// Task statuses for production workflow
const TASK_STATUSES = [
  // Common statuses
  'todo',           // Task created, not started
  'in_progress',    // Assigned user is working on it

  // Content creation workflow
  'content_pending',        // Awaiting content creator
  'content_submitted',      // Content submitted for tester review
  'content_approved',       // LEGACY - Content approved by tester (old flow)
  'content_rejected',       // Content rejected
  'content_final_approved', // Content approved by tester, ready for design (NEW FLOW - skip marketer for content)

  // Design workflow
  'design_pending',         // Awaiting designer
  'design_submitted',       // Design submitted for tester review
  'design_approved',        // Design approved by tester, awaiting marketer review
  'design_rejected',        // Design rejected

  // Final status
  'final_approved',         // Fully approved by performance marketer

  // Legacy statuses (for backward compatibility)
  'submitted',              // Work submitted for review
  'approved_by_tester',     // Tester approved, awaiting marketer review
  'rejected',               // Rejected with notes
  'development_pending',     // Landing page: awaiting development
  'development_submitted',   // Landing page: development submitted for tester review
  'development_approved'    // Landing page: development approved, awaiting marketer
];

// Asset types that can be produced
const ASSET_TYPES = [
  'image_creative',
  'video_creative',
  'carousel_creative',
  'reel',
  'static_ad',
  'landing_page_design',
  'landing_page_page',
  // Content task variants
  'image_creative_content',
  'video_creative_content',
  'carousel_creative_content',
  'reel_content',
  'ugc_content',
  'testimonial_content',
  'demo_video',
  'offer_creative'
];

// Role assignment mapping
const ROLE_ASSIGNMENT = {
  content_creation: 'content_writer',
  graphic_design: 'graphic_designer',
  video_editing: 'video_editor',
  landing_page_design: 'ui_ux_designer',
  landing_page_development: 'developer'
};

const taskSchema = new mongoose.Schema({
  // References
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  creativeStrategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreativeStrategy'
  },
  creativeId: {
    type: mongoose.Schema.Types.ObjectId
  },
  landingPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LandingPage',
    description: 'Reference to the landing page this task is associated with'
  },
  adTypeKey: {
    type: String,
    description: 'Reference to ad type from creative strategy (awareness, consideration, etc.)'
  },

  // Task identification
  taskTitle: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    enum: TASK_TYPES,
    required: true
  },
  assetType: {
    type: String,
    enum: ASSET_TYPES
  },
  creativeOutputType: {
    type: String,
    enum: ['image_creative', 'video_creative', 'carousel_creative', 'reel', 'ugc_content', 'testimonial_content', 'demo_video', 'offer_creative', null],
    description: 'For content_writer tasks: indicates which type of creative this content is for'
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedRole: {
    type: String,
    enum: ['content_creator', 'content_writer', 'graphic_designer', 'video_editor', 'ui_ux_designer', 'developer', 'tester', 'performance_marketer'],
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Tester assigned to review this task (from project team)
  testerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'The tester assigned to review this task'
  },
  // Performance Marketer assigned for final approval
  marketerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'The performance marketer assigned for final approval'
  },
  // Parent task dependency (e.g., design task depends on content task)
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    description: 'Parent task that must be completed before this task can start'
  },

  // Status pipeline
  status: {
    type: String,
    enum: TASK_STATUSES,
    default: 'todo'
  },

  // Task details
  description: { type: String },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // AI-generated content
  aiPrompt: {
    type: String,
    description: 'AI-generated prompt for the task based on strategy context'
  },
  sopReference: {
    type: String,
    description: 'Reference to standard operating procedure document'
  },

  // Strategy context (for designers - complete creative brief)
  strategyContext: {
    // Business context
    businessName: { type: String },
    industry: { type: String },

    // Creative identification
    funnelStage: {
      type: String,
      description: 'Which funnel stage this creative belongs to (awareness, consideration, conversion)'
    },
    creativeType: {
      type: String,
      description: 'Type of creative (image_creative, video_creative, carousel_creative, reel, static_ad)'
    },
    platform: {
      type: String,
      description: 'Target platform for this specific creative (facebook, instagram, etc.)'
    },
    platforms: [{
      type: String,
      description: 'All applicable platforms for reference'
    }],

    // Creative brief content
    hook: { type: String },
    creativeAngle: { type: String },
    messaging: { type: String },
    headline: { type: String },
    cta: { type: String },

    // Target audience
    targetAudience: { type: String },
    painPoints: [{ type: String }],
    desires: [{ type: String }],

    // Offer information
    offer: { type: String },

    // Additional context
    notes: { type: String },
    adTypeKey: { type: String },
    adTypeName: { type: String },

    // Creative plan fields
    creativeType: { type: String },
    creativeCategory: { type: String }
  },

  // Strategy Context Links (for team members)
  contextLink: {
    type: String,
    description: 'Link to the full strategy summary page'
  },
  contextPdfUrl: {
    type: String,
    description: 'URL to downloadable PDF strategy summary'
  },

  // Due date and timing
  dueDate: { type: Date },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  completedAt: { type: Date },

  // Output/assets
  assetUrl: { type: String },
  outputFiles: [{
    name: { type: String },
    path: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Content output (for content writing tasks)
  contentOutput: {
    headline: { type: String },
    bodyText: { type: String },
    cta: { type: String },
    script: { type: String },
    notes: { type: String }
  },

  // Content Creator submission fields
  contentLink: {
    type: String,
    description: 'Link to content (Google Docs, Dropbox, etc.)'
  },
  contentFile: {
    name: { type: String },
    path: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  contentNotes: {
    type: String,
    description: 'Notes from content creator'
  },

  // Submission fields (for designer submission)
  creativeLink: {
    type: String,
    description: 'Link to external creative (Figma, Canva, Google Drive, etc.)'
  },
  reviewNotes: {
    type: String,
    description: 'Notes from designer to reviewer'
  },

  // Landing Page Design submission fields (UI/UX Designer)
  designLink: {
    type: String,
    description: 'Link to design file (Figma, Drive, etc.) for landing page'
  },
  designFile: {
    name: { type: String },
    path: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  },
  designNotes: {
    type: String,
    description: 'Notes from UI/UX designer to developer'
  },

  // Landing Page Development submission fields (Developer)
  implementationUrl: {
    type: String,
    description: 'URL to the implemented landing page'
  },
  repoLink: {
    type: String,
    description: 'Link to code repository (optional)'
  },
  devNotes: {
    type: String,
    description: 'Notes from developer to tester'
  },

  // Review workflow
  rejectionNote: { type: String },
  rejectionReason: { type: String },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: { type: Date },
  testerReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  testerReviewedAt: { type: Date },
  marketerApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  marketerApprovedAt: { type: Date },

  // Revision tracking
  revisionCount: {
    type: Number,
    default: 0
  },
  revisionHistory: [{
    status: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: { type: String }
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedRole: 1, status: 1 });
taskSchema.index({ taskType: 1, status: 1 });
taskSchema.index({ landingPageId: 1 });

// Static method to get role for task type
taskSchema.statics.getRoleForTaskType = function(taskType) {
  return ROLE_ASSIGNMENT[taskType] || 'graphic_designer';
};

// Static method to get initial status for task type
taskSchema.statics.getInitialStatus = function(taskType) {
  if (taskType === 'content_creation') {
    return 'content_pending';
  }
  if (taskType === 'landing_page_design') {
    return 'design_pending';
  }
  if (taskType === 'landing_page_development') {
    return 'development_pending';
  }
  return 'todo';
};

// Method to check if task can be submitted
taskSchema.methods.canSubmit = function() {
  const submittableStatuses = [
    'todo', 'in_progress', 'rejected',
    'content_pending', 'content_rejected',
    'design_pending', 'design_rejected',
    'development_pending'
  ];
  return submittableStatuses.includes(this.status);
};

// Method to check if task can be reviewed by tester
taskSchema.methods.canBeReviewedByTester = function() {
  const testerReviewableStatuses = [
    'content_submitted',    // Content creator submitted for tester review
    'design_submitted',     // Designer submitted for tester review
    'development_submitted' // Developer submitted for tester review
  ];
  return testerReviewableStatuses.includes(this.status);
};

// Method to check if task can be approved by marketer
taskSchema.methods.canBeApprovedByMarketer = function() {
  const marketerApprovableStatuses = [
    // Note: content_approved is NOT included - content goes directly to design after tester approval
    // Marketer only approves final design/video, not content
    'design_approved',     // Design approved by tester, awaiting marketer (for creative tasks)
    'development_approved'  // Development approved by tester, awaiting marketer (for landing pages)
  ];
  return marketerApprovableStatuses.includes(this.status);
};

// Method to get next status after approval
taskSchema.methods.getNextStatus = function(currentStatus, action, taskType) {
  // Content creation workflow - NEW FLOW: Tester approves content → Design starts (skip marketer)
  if (currentStatus === 'content_pending' && action === 'submit') return 'content_submitted';
  if (currentStatus === 'content_submitted' && action === 'approve_tester') return 'content_final_approved'; // Direct to design, skip marketer
  if (currentStatus === 'content_submitted' && action === 'reject') return 'content_rejected';
  if (currentStatus === 'content_rejected' && action === 'resubmit') return 'content_submitted';
  if (currentStatus === 'content_final_approved' && action === 'start_design') return 'design_pending';

  // Design workflow (for graphic design/video tasks)
  // Marketer only reviews final design, not content
  if (currentStatus === 'design_pending' && action === 'submit') return 'design_submitted';
  if (currentStatus === 'design_submitted' && action === 'approve_tester') return 'design_approved';
  if (currentStatus === 'design_submitted' && action === 'reject') return 'design_rejected';
  if (currentStatus === 'design_rejected' && action === 'resubmit') return 'design_submitted';
  if (currentStatus === 'design_approved' && action === 'approve_marketer') return 'final_approved';
  if (currentStatus === 'design_approved' && action === 'reject') return 'design_rejected';

  // Landing page design workflow (goes to development after marketer approval)
  if (taskType === 'landing_page_design') {
    if (currentStatus === 'design_pending' && action === 'submit') return 'design_submitted';
    if (currentStatus === 'design_submitted' && action === 'approve_tester') return 'design_approved';
    if (currentStatus === 'design_submitted' && action === 'reject') return 'design_rejected';
    if (currentStatus === 'design_rejected' && action === 'resubmit') return 'design_submitted';
    if (currentStatus === 'design_approved' && action === 'approve_marketer') return 'development_pending';
    if (currentStatus === 'design_approved' && action === 'reject') return 'design_rejected';
  }

  // Landing page development workflow
  if (taskType === 'landing_page_development') {
    if (currentStatus === 'development_pending' && action === 'submit') return 'development_submitted';
    if (currentStatus === 'development_submitted' && action === 'approve_tester') return 'development_approved';
    if (currentStatus === 'development_submitted' && action === 'reject') return 'development_pending';
    if (currentStatus === 'development_approved' && action === 'approve_marketer') return 'final_approved';
    if (currentStatus === 'development_approved' && action === 'reject') return 'development_pending';
  }

  // Standard creative workflow (legacy)
  if (currentStatus === 'todo' && action === 'start') return 'in_progress';
  if (currentStatus === 'in_progress' && action === 'submit') return 'submitted';
  if (currentStatus === 'submitted' && action === 'approve_tester') return 'approved_by_tester';
  if (currentStatus === 'submitted' && action === 'reject') return 'rejected';
  if (currentStatus === 'approved_by_tester' && action === 'approve_marketer') return 'final_approved';
  if (currentStatus === 'approved_by_tester' && action === 'reject') return 'rejected';
  if (currentStatus === 'rejected' && action === 'resubmit') return 'submitted';

  return currentStatus;
};

// Add revision to history
taskSchema.methods.addRevision = function(userId, note, oldStatus, newStatus) {
  this.revisionHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    note: note
  });
  this.revisionCount = this.revisionHistory.length;
  return this;
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
module.exports.TASK_TYPES = TASK_TYPES;
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.ASSET_TYPES = ASSET_TYPES;
module.exports.ROLE_ASSIGNMENT = ROLE_ASSIGNMENT;