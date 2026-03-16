const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  value: {
    type: Number,
    default: 0
  }
}, { _id: false });

const pricingSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  upsell: {
    enabled: { type: Boolean, default: false },
    price: { type: Number },
    description: { type: String }
  },
  crossSell: {
    enabled: { type: Boolean, default: false },
    price: { type: Number },
    description: { type: String }
  }
}, { _id: false });

const offerSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  functionalValues: [{
    type: String,
    trim: true
  }],
  emotionalValues: [{
    type: String,
    trim: true
  }],
  socialValues: [{
    type: String,
    trim: true
  }],
  economicValues: [{
    type: String,
    trim: true
  }],
  experientialValues: [{
    type: String,
    trim: true
  }],
  bonuses: [bonusSchema],
  guarantees: [{
    type: String,
    trim: true
  }],
  urgencyTactics: [{
    type: String,
    trim: true
  }],
  pricing: {
    type: pricingSchema,
    default: () => ({})
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
offerSchema.methods.calculateCompletion = function() {
  const requiredFields = [
    'functionalValues',
    'emotionalValues',
    'socialValues',
    'economicValues',
    'experientialValues'
  ];

  let completedFields = 0;

  requiredFields.forEach(field => {
    if (this[field] && this[field].length > 0) {
      completedFields++;
    }
  });

  if (this.bonuses?.length > 0) completedFields++;
  if (this.guarantees?.length > 0) completedFields++;
  if (this.pricing?.basePrice) completedFields++;

  return Math.round((completedFields / 8) * 100);
};

module.exports = mongoose.model('Offer', offerSchema);