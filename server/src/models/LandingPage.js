const mongoose = require('mongoose');

const nurturingSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['email', 'whatsapp', 'sms'],
    default: 'email'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
    default: 'weekly'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const leadCaptureSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['form', 'calendly', 'whatsapp', 'free_audit'],
    default: 'form'
  },
  fields: [{
    type: String,
    enum: ['name', 'email', 'phone', 'company', 'message']
  }],
  calendlyLink: {
    type: String
  },
  whatsappNumber: {
    type: String
  }
}, { _id: false });

const landingPageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Main Landing Page'
  },
  order: {
    type: Number,
    default: 0
  },
  // Strategy fields (frontend-facing names)
  hook: {
    type: String,
    trim: true
  },
  angle: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'youtube', 'google', 'linkedin', 'tiktok', 'twitter', 'whatsapp', 'multi'],
    default: 'facebook'
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
  // Funnel type (frontend field name - primary)
  funnelType: {
    type: String,
    enum: ['video_sales_letter', 'long_form', 'lead_magnet', 'ebook', 'webinar'],
    default: 'video_sales_letter'
  },
  // Legacy field for backward compatibility
  type: {
    type: String,
    enum: ['video_sales_letter', 'long_form', 'lead_magnet', 'ebook', 'webinar'],
    default: 'video_sales_letter'
  },
  // Legacy ctaText for backward compatibility
  ctaText: {
    type: String,
    trim: true
  },
  headline: {
    type: String,
    trim: true
  },
  subheadline: {
    type: String,
    trim: true
  },
  // Extended lead capture configuration
  leadCapture: {
    type: leadCaptureSchema,
    default: () => ({})
  },
  nurturing: [nurturingSchema],
  designPreferences: {
    primaryColor: { type: String, default: '#3B82F6' },
    secondaryColor: { type: String, default: '#1E40AF' },
    fontFamily: { type: String, default: 'Inter' },
    style: { type: String, enum: ['modern', 'classic', 'minimal', 'bold'] }
  },
  seoSettings: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }]
  },
  isActive: {
    type: Boolean,
    default: true
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

// Compound index for unique order within project
landingPageSchema.index({ projectId: 1, order: 1 }, { unique: true });

// Calculate completion percentage
landingPageSchema.methods.calculateCompletion = function() {
  let completedItems = 0;
  const totalItems = 8;

  if (this.name) completedItems++;
  if (this.funnelType || this.type) completedItems++;
  if (this.hook) completedItems++;
  if (this.angle) completedItems++;
  if (this.platform) completedItems++;
  if (this.leadCaptureMethod || this.leadCapture?.method) completedItems++;
  if (this.headline) completedItems++;
  if (this.cta || this.ctaText) completedItems++;

  return Math.round((completedItems / totalItems) * 100);
};

module.exports = mongoose.model('LandingPage', landingPageSchema);