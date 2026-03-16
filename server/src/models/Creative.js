const mongoose = require('mongoose');

// Creative Categories
const CREATIVE_CATEGORIES = [
  'IMAGE',
  'VIDEO',
  'CAROUSEL',
  'UGC',
  'TESTIMONIAL',
  'DEMO_EXPLAINER',
  'OFFER_SALES'
];

// Main Creative Types (simplified)
const MAIN_CREATIVE_TYPES = ['IMAGE', 'VIDEO', 'CAROUSEL'];

// Campaign Objectives (Ad Types)
const CAMPAIGN_OBJECTIVES = [
  'awareness',
  'nurturing',
  'traffic',
  'retargeting',
  'engagement',
  'lead_generation',
  'conversion',
  'app_install',
  'sales',
  'brand_consideration'
];

// Sub-types per Creative Type
const CREATIVE_SUBTYPES = {
  IMAGE: [
    'Problem Image',
    'Solution Image',
    'Offer Image',
    'Discount Image',
    'Limited Time Offer',
    'Before - After',
    'Comparison',
    'Feature Highlight',
    'Benefit Image',
    'Statistic / Data',
    'Question Hook',
    'Bold Statement',
    'Testimonial Screenshot',
    'Review Image',
    'Result Proof',
    'Authority Quote',
    'Meme',
    'Relatable Situation',
    'Urgency',
    'CTA Focus'
  ],
  VIDEO: [
    'Problem Hook',
    'Storytelling',
    'Product Demo',
    'Service Demo',
    'Explainer',
    'Educational Tip',
    'Myth vs Reality',
    'Offer Announcement',
    'Urgency',
    'Behind The Scenes',
    'Founder Message',
    'FAQ',
    'Case Study',
    'Testimonial',
    'Comparison',
    'How It Works',
    'Objection Handling',
    'Trend Reel',
    'Screen Recording',
    'Sales Pitch'
  ],
  CAROUSEL: [
    'Feature Carousel',
    'Benefit Carousel',
    'Step by Step',
    'Before After',
    'Testimonial',
    'Case Study',
    'Product Showcase',
    'Offer Breakdown'
  ]
};

// Legacy AD_TYPES for backward compatibility
const AD_TYPES = CREATIVE_SUBTYPES;

// Platforms
const PLATFORMS = ['instagram', 'facebook', 'youtube', 'linkedin', 'google_display'];

// Screen Sizes per Platform
const SCREEN_SIZES = {
  instagram: ['square', 'portrait', 'three_four', 'story', 'reel'],
  facebook: ['feed', 'story', 'video'],
  youtube: ['thumbnail', 'shorts', 'video'],
  linkedin: ['feed', 'story', 'video'],
  google_display: ['square', 'landscape', 'skyscraper']
};

// Creative Types per Category (legacy support for backward compatibility)
const CREATIVE_TYPES = {
  IMAGE: [
    'Problem Image',
    'Solution Image',
    'Offer Image',
    'Discount Image',
    'Limited Time Offer Image',
    'Before – After Image',
    'Comparison Image',
    'Feature Highlight Image',
    'Benefit Image',
    'Statistic / Data Image',
    'Question Hook Image',
    'Bold Statement Image',
    'Testimonial Screenshot Image',
    'Review Image',
    'Result Proof Image',
    'Authority Quote Image',
    'Meme Image',
    'Relatable Situation Image',
    'Urgency Image',
    'CTA Focus Image'
  ],
  VIDEO: [
    'Problem Hook Video',
    'Storytelling Video',
    'Product Demo Video',
    'Service Demo Video',
    'Explainer Video',
    'Educational Tip Video',
    'Myth vs Reality Video',
    'Offer Announcement Video',
    'Urgency Video',
    'Behind The Scenes Video',
    'Founder Message Video',
    'FAQ Video',
    'Case Study Video',
    'Testimonial Video',
    'Comparison Video',
    'How It Works Video',
    'Objection Handling Video',
    'Trend Reel Video',
    'Screen Recording Video',
    'Sales Pitch Video'
  ],
  CAROUSEL: [
    'Feature Carousel',
    'Benefit Carousel',
    'Step by Step Carousel',
    'Before After Carousel',
    'Testimonial Carousel',
    'Case Study Carousel',
    'Product Showcase Carousel',
    'Offer Breakdown Carousel'
  ],
  UGC: [
    'Selfie Review Video',
    'Customer Experience Video',
    'Reaction Video',
    'Unboxing Video',
    'Day in Life Video',
    'Real Life Story Video'
  ],
  TESTIMONIAL: [
    'Video Testimonial',
    'Screenshot Review',
    'Google Review Image',
    'Client Success Story',
    'Result Dashboard Proof'
  ],
  DEMO_EXPLAINER: [
    'Screen Recording Demo',
    'Product Usage Demo',
    'Service Process Demo',
    'Tutorial Video',
    'Walkthrough Video'
  ],
  OFFER_SALES: [
    'Launch Offer',
    'Limited Time Offer',
    'Discount Offer',
    'Festive Offer',
    'Bonus Offer',
    'Last Chance Offer',
    'Price Breakdown Creative',
    'Guarantee Creative'
  ]
};

// Assigned Roles for Creative Production
const CREATIVE_ROLES = [
  'content_writer',
  'graphic_designer',
  'video_editor'
];

// Creative Plan Item - Individual creative row
const creativePlanItemSchema = new mongoose.Schema({
  // Name/label for the creative
  name: {
    type: String,
    trim: true
  },
  // Main creative type (IMAGE, VIDEO, CAROUSEL)
  creativeType: {
    type: String,
    enum: MAIN_CREATIVE_TYPES,
    required: true
  },
  // Sub-type based on creative type (e.g., Problem Image, Storytelling, etc.)
  subType: {
    type: String,
    required: true
  },
  // Campaign objective (awareness, nurturing, traffic, etc.)
  objective: {
    type: String,
    enum: CAMPAIGN_OBJECTIVES
  },
  // Platforms (multi-select)
  platforms: [{
    type: String,
    enum: PLATFORMS
  }],
  // Screen sizes (multi-select based on platforms)
  screenSizes: [{
    type: String
  }],
  // Assigned role for this creative
  assignedRole: {
    type: String,
    enum: CREATIVE_ROLES
  },
  // Assigned team members (user IDs)
  assignedTeamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Additional notes
  notes: {
    type: String,
    trim: true
  },
  // Legacy fields for backward compatibility
  category: {
    type: String,
    enum: CREATIVE_CATEGORIES
  },
  adType: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Creative details for each ad type (legacy)
const adCreativeDetailsSchema = new mongoose.Schema({
  // Number of creatives
  imageCreatives: {
    type: Number,
    default: 0,
    min: 0
  },
  videoCreatives: {
    type: Number,
    default: 0,
    min: 0
  },
  carouselCreatives: {
    type: Number,
    default: 0,
    min: 0
  },
  // Messaging and content
  messagingAngle: {
    type: String,
    trim: true
  },
  hook: {
    type: String,
    trim: true
  },
  headline: {
    type: String,
    trim: true
  },
  cta: {
    type: String,
    trim: true
  },
  // Platform selection
  platforms: [{
    type: String,
    enum: ['facebook', 'instagram', 'youtube', 'google', 'linkedin', 'tiktok', 'twitter', 'whatsapp']
  }],
  // Additional notes for this ad type
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

// Ad Type schema - supports both predefined and custom types
const adTypeSchema = new mongoose.Schema({
  // Type identifier (e.g., 'awareness', 'consideration', 'conversion', 'influencer_ads', etc.)
  typeKey: {
    type: String,
    required: true
  },
  // Display name
  typeName: {
    type: String,
    required: true
  },
  // Whether this is a predefined type or custom
  isCustom: {
    type: Boolean,
    default: false
  },
  // Icon name for UI display
  icon: {
    type: String,
    default: 'Megaphone'
  },
  // Creative details for this ad type
  creatives: adCreativeDetailsSchema,
  // Order for display purposes
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Individual creative item (for task workflow)
const creativeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  creativeType: {
    type: String,
    enum: ['static_creative', 'video_creative', 'video_content', 'carousel'],
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok', 'twitter', 'google', 'whatsapp'],
    required: true
  },
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  copy: {
    headline: { type: String },
    bodyText: { type: String },
    cta: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'approved', 'rejected'],
    default: 'pending'
  },
  assignedContentWriter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDesigner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contentStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  designStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  contentOutput: {
    headline: { type: String },
    bodyText: { type: String },
    cta: { type: String },
    script: { type: String },
    notes: { type: String }
  },
  contentAssignedAt: { type: Date },
  contentCompletedAt: { type: Date },
  designAssignedAt: { type: Date },
  designCompletedAt: { type: Date },
  dueDate: { type: Date },
  notes: { type: String },
  files: [{
    name: { type: String },
    path: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Legacy stage creative schema (for backward compatibility)
const stageCreativeSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['awareness', 'consideration', 'conversion'],
    required: true
  },
  creatives: [creativeItemSchema],
  totalCreatives: {
    type: Number,
    default: 0
  }
}, { _id: false });

const creativeStrategySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  // NEW: Creative Plan - structured creative planning
  creativePlan: [creativePlanItemSchema],
  // Selected creative categories with quantities
  creativeCategories: [{
    category: {
      type: String,
      enum: CREATIVE_CATEGORIES
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  // Legacy: Ad types system
  adTypes: [adTypeSchema],
  // Additional notes from performance marketer
  additionalNotes: {
    type: String,
    trim: true
  },
  // Legacy stages (for backward compatibility)
  stages: [stageCreativeSchema],
  totalCreatives: {
    type: Number,
    default: 0
  },
  creativeBrief: {
    type: String,
    trim: true
  },
  brandGuidelines: {
    logo: { type: String },
    colors: [{ type: String }],
    fonts: [{ type: String }],
    toneOfVoice: { type: String }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate total creatives
creativeStrategySchema.methods.calculateTotal = function() {
  let total = 0;

  // From new creativePlan system
  if (this.creativePlan && this.creativePlan.length > 0) {
    total = this.creativePlan.length;
  }

  // From creativeCategories (quantity sum)
  if (this.creativeCategories && this.creativeCategories.length > 0) {
    total = Math.max(total, this.creativeCategories.reduce((sum, cat) => sum + (cat.quantity || 0), 0));
  }

  // From legacy adTypes system
  if (this.adTypes && this.adTypes.length > 0) {
    const adTypesTotal = this.adTypes.reduce((sum, adType) => {
      if (adType.creatives) {
        return sum + (adType.creatives.imageCreatives || 0) +
                     (adType.creatives.videoCreatives || 0) +
                     (adType.creatives.carouselCreatives || 0);
      }
      return sum;
    }, 0);
    total = Math.max(total, adTypesTotal);
  }

  // From legacy stages system
  if (this.stages && this.stages.length > 0) {
    const stagesTotal = this.stages.reduce((sum, stage) => {
      stage.totalCreatives = stage.creatives?.length || 0;
      return sum + stage.totalCreatives;
    }, 0);
    total = Math.max(total, stagesTotal);
  }

  this.totalCreatives = total;
  return total;
};

// Calculate completion percentage
creativeStrategySchema.methods.calculateCompletion = function() {
  let completedItems = 0;
  const totalItems = 3;

  // Check if creativePlan has items
  if (this.creativePlan && this.creativePlan.length > 0) {
    completedItems++;
  }
  // Check if creativeCategories has quantities
  else if (this.creativeCategories && this.creativeCategories.some(c => c.quantity > 0)) {
    completedItems++;
  }
  // Check legacy adTypes
  else if (this.adTypes && this.adTypes.length > 0) {
    completedItems++;
  }
  // Check legacy stages
  else if (this.stages && this.stages.some(s => s.creatives && s.creatives.length > 0)) {
    completedItems++;
  }

  // Check if creative brief or additional notes exist
  if (this.creativeBrief || this.additionalNotes) completedItems++;

  // Check if creative plan has assigned roles
  if (this.creativePlan && this.creativePlan.some(item => item.assignedRole)) {
    completedItems++;
  }
  // Check legacy configuration
  else if (this.adTypes && this.adTypes.some(at =>
    at.creatives && (
      (at.creatives.imageCreatives > 0) ||
      (at.creatives.videoCreatives > 0) ||
      (at.creatives.carouselCreatives > 0)
    )
  )) {
    completedItems++;
  }
  else if (this.stages && this.stages.some(s => s.creatives && s.creatives.some(c => c.assignedDesigner))) {
    completedItems++;
  }

  return Math.round((completedItems / totalItems) * 100);
};

// Export constants for use in frontend
module.exports.CREATIVE_CATEGORIES = CREATIVE_CATEGORIES;
module.exports.CREATIVE_TYPES = CREATIVE_TYPES;
module.exports.CREATIVE_ROLES = CREATIVE_ROLES;
module.exports.MAIN_CREATIVE_TYPES = MAIN_CREATIVE_TYPES;
module.exports.CREATIVE_SUBTYPES = CREATIVE_SUBTYPES;
module.exports.CAMPAIGN_OBJECTIVES = CAMPAIGN_OBJECTIVES;
module.exports.AD_TYPES = AD_TYPES;
module.exports.PLATFORMS = PLATFORMS;
module.exports.SCREEN_SIZES = SCREEN_SIZES;

module.exports = mongoose.model('CreativeStrategy', creativeStrategySchema);