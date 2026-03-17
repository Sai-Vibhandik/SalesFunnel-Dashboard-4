const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters']
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^[+]?[\d\s-]{10,15}$/, 'Please enter a valid mobile number']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  industry: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  budget: {
    type: Number,
    min: 0
  },
  timeline: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  brandAssets: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTeam: {
    // Support both single user (legacy) and multiple users (new) per role
    performanceMarketers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    contentWriters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    uiUxDesigners: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    graphicDesigners: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    videoEditors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    developers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    testers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Legacy fields for backward compatibility
    performanceMarketer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contentCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contentWriter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uiUxDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    graphicDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    videoEditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  currentStage: {
    type: Number,
    default: 1,
    min: 1,
    max: 6
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  stages: {
    onboarding: {
      isCompleted: { type: Boolean, default: true },
      completedAt: { type: Date, default: Date.now }
    },
    marketResearch: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    offerEngineering: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    trafficStrategy: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    landingPage: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    },
    creativeStrategy: {
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date }
    }
  },
  // Landing Pages array - embedded within project
  landingPages: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    funnelType: {
      type: String,
      enum: ['video_sales_letter', 'long_form', 'lead_magnet', 'ebook', 'webinar'],
      default: 'video_sales_letter'
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'youtube', 'google', 'linkedin', 'tiktok', 'twitter', 'whatsapp', 'multi'],
      default: 'facebook'
    },
    hook: {
      type: String,
      trim: true
    },
    angle: {
      type: String,
      trim: true
    },
    cta: {
      type: String,
      trim: true
    },
    offer: {
      type: String,
      trim: true
    },
    messaging: {
      type: String,
      trim: true
    },
    leadCaptureMethod: {
      type: String,
      enum: ['form', 'calendly', 'whatsapp', 'free_audit'],
      default: 'form'
    },
    headline: {
      type: String,
      trim: true
    },
    subheadline: {
      type: String,
      trim: true
    },
    // Team member assignments for this specific landing page
    assignedDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'UI/UX Designer assigned to this landing page'
    },
    assignedDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'Developer assigned to this landing page'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  strategyStatus: {
    type: String,
    enum: ['in_progress', 'completed', 'reviewed'],
    default: 'in_progress'
  },
  strategyCompletedAt: {
    type: Date
  },
  strategyReviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate overall progress
projectSchema.methods.calculateProgress = function() {
  const stages = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const completedStages = stages.filter(stage => this.stages[stage].isCompleted).length;
  this.overallProgress = Math.round((completedStages / stages.length) * 100);
  return this.overallProgress;
};

// Get next available stage
projectSchema.methods.getNextStage = function() {
  const stages = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const stageNames = ['Onboarding', 'Market Research', 'Offer Engineering', 'Traffic Strategy', 'Landing Page', 'Creative Strategy'];

  for (let i = 0; i < stages.length; i++) {
    if (!this.stages[stages[i]].isCompleted) {
      return { index: i + 1, name: stageNames[i], key: stages[i] };
    }
  }
  return { index: 6, name: 'Completed', key: 'creativeStrategy' };
};

// Check if a stage is accessible
projectSchema.methods.isStageAccessible = function(stageKey) {
  const stages = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const stageIndex = stages.indexOf(stageKey);

  if (stageIndex === 0) return true;

  for (let i = 0; i < stageIndex; i++) {
    if (!this.stages[stages[i]].isCompleted) {
      return false;
    }
  }
  return true;
};

module.exports = mongoose.model('Project', projectSchema);