const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['meta_ads', 'google_ads', 'linkedin_ads', 'youtube_ads', 'podcasts', 'organic', 'radio', 'offline_ads']
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  justification: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    min: 0
  }
}, { _id: false });

const hookSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['curiosity', 'pain_point', 'benefit', 'story', 'statistic'],
    default: 'curiosity'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const trafficStrategySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  channels: [channelSchema],
  hooks: [hookSchema],
  targetAudience: {
    primaryAge: { type: String },
    primaryLocation: { type: String },
    primaryInterests: [{ type: String }]
  },
  totalBudget: {
    type: Number,
    min: 0
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

// Calculate completion percentage
trafficStrategySchema.methods.calculateCompletion = function() {
  let completedItems = 0;
  const totalItems = 3;

  // Check if at least one channel is selected
  const selectedChannels = this.channels?.filter(c => c.isSelected) || [];
  if (selectedChannels.length > 0) completedItems++;

  // Check if hooks exist
  if (this.hooks?.length > 0) completedItems++;

  // Check if budget is set
  if (this.totalBudget > 0) completedItems++;

  return Math.round((completedItems / totalItems) * 100);
};

module.exports = mongoose.model('TrafficStrategy', trafficStrategySchema);