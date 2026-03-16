// Main Creative Types (only 3)
export const CREATIVE_TYPES = [
  { key: 'IMAGE', label: 'Image' },
  { key: 'VIDEO', label: 'Video' },
  { key: 'CAROUSEL', label: 'Carousel' }
];

// Sub-types per Creative Type (shown after selecting main type)
export const CREATIVE_SUBTYPES = {
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

// Campaign Objectives (Ad Type column)
export const CAMPAIGN_OBJECTIVES = [
  { key: 'awareness', label: 'Awareness' },
  { key: 'nurturing', label: 'Nurturing' },
  { key: 'traffic', label: 'Traffic' },
  { key: 'retargeting', label: 'Retargeting' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'lead_generation', label: 'Lead Generation' },
  { key: 'conversion', label: 'Conversion' },
  { key: 'app_install', label: 'App Install' },
  { key: 'sales', label: 'Sales' },
  { key: 'brand_consideration', label: 'Brand Consideration' }
];

// Creative Roles for assignment
export const CREATIVE_ROLES = [
  { key: 'content_writer', label: 'Content Writer' },
  { key: 'graphic_designer', label: 'Graphic Designer' },
  { key: 'video_editor', label: 'Video Editor' }
];

// Legacy export for backward compatibility
export const AD_TYPES = CREATIVE_SUBTYPES;

// Platforms
export const PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'google_display', label: 'Google Display' }
];

// Screen Sizes per Platform
export const SCREEN_SIZES = {
  instagram: [
    { key: 'square', label: 'Square (1:1)', dimensions: '1080x1080' },
    { key: 'portrait', label: 'Portrait (4:5)', dimensions: '1080x1350' },
    { key: 'three_four', label: '3:4', dimensions: '1080x1440' },
    { key: 'story', label: 'Story (9:16)', dimensions: '1080x1920' },
    { key: 'reel', label: 'Reel (9:16)', dimensions: '1080x1920' }
  ],
  facebook: [
    { key: 'feed', label: 'Feed', dimensions: '1200x630' },
    { key: 'story', label: 'Story (9:16)', dimensions: '1080x1920' },
    { key: 'video', label: 'Video (16:9)', dimensions: '1920x1080' }
  ],
  youtube: [
    { key: 'thumbnail', label: 'Thumbnail', dimensions: '1280x720' },
    { key: 'shorts', label: 'Shorts (9:16)', dimensions: '1080x1920' },
    { key: 'video', label: 'Video (16:9)', dimensions: '1920x1080' }
  ],
  linkedin: [
    { key: 'feed', label: 'Feed Post', dimensions: '1200x627' },
    { key: 'story', label: 'Story', dimensions: '1080x1920' },
    { key: 'video', label: 'Video', dimensions: '1920x1080' }
  ],
  google_display: [
    { key: 'square', label: 'Square (1:1)', dimensions: '300x300' },
    { key: 'landscape', label: 'Landscape (4:3)', dimensions: '300x250' },
    { key: 'skyscraper', label: 'Skyscraper', dimensions: '160x600' }
  ]
};

// Get screen sizes for selected platforms
export const getScreenSizesForPlatforms = (platforms) => {
  if (!platforms || platforms.length === 0) return [];

  const screenSizes = [];
  const seenKeys = new Set();

  platforms.forEach(platform => {
    const sizes = SCREEN_SIZES[platform] || [];
    sizes.forEach(size => {
      if (!seenKeys.has(size.key)) {
        seenKeys.add(size.key);
        screenSizes.push({
          ...size,
          platform // Track which platform this size belongs to
        });
      }
    });
  });

  return screenSizes;
};

// Get sub-types for creative type
export const getSubTypesForCreativeType = (creativeType) => {
  return CREATIVE_SUBTYPES[creativeType] || [];
};

// Legacy function for backward compatibility
export const getAdTypesForCreativeType = getSubTypesForCreativeType;

// Get label for creative type
export const getCreativeTypeLabel = (key) => {
  const type = CREATIVE_TYPES.find(t => t.key === key);
  return type ? type.label : key;
};

// Get label for platform
export const getPlatformLabel = (key) => {
  const platform = PLATFORMS.find(p => p.key === key);
  return platform ? platform.label : key;
};

// Get label for screen size
export const getScreenSizeLabel = (platform, key) => {
  const sizes = SCREEN_SIZES[platform] || [];
  const size = sizes.find(s => s.key === key);
  return size ? size.label : key;
};

// Get label for campaign objective
export const getObjectiveLabel = (key) => {
  const objective = CAMPAIGN_OBJECTIVES.find(o => o.key === key);
  return objective ? objective.label : key;
};

// Get label for creative role
export const getRoleLabel = (key) => {
  const role = CREATIVE_ROLES.find(r => r.key === key);
  return role ? role.label : key;
};