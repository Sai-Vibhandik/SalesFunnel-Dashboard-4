const Project = require('../models/Project');
const MarketResearch = require('../models/MarketResearch');
const Offer = require('../models/Offer');
const TrafficStrategy = require('../models/TrafficStrategy');
const LandingPage = require('../models/LandingPage');
const CreativeStrategy = require('../models/Creative');

/**
 * Generate a comprehensive strategy summary for a project
 * @param {string} projectId - The project ID
 * @returns {object} Strategy summary object
 */
async function getStrategySummary(projectId) {
  const [project, marketResearch, offer, trafficStrategy, landingPage, creativeStrategy] = await Promise.all([
    Project.findById(projectId).populate('assignedTeam.performanceMarketer', 'name email'),
    MarketResearch.findOne({ projectId }),
    Offer.findOne({ projectId }),
    TrafficStrategy.findOne({ projectId }),
    LandingPage.findOne({ projectId }),
    CreativeStrategy.findOne({ projectId })
  ]);

  if (!project) {
    throw new Error('Project not found');
  }

  const summary = {
    project: {
      projectName: project.projectName,
      businessName: project.businessName,
      customerName: project.customerName,
      email: project.email,
      mobile: project.mobile,
      industry: project.industry,
      description: project.description,
      budget: project.budget,
      timeline: project.timeline,
      performanceMarketer: project.assignedTeam.performanceMarketer
    },
    marketResearch: null,
    offer: null,
    trafficStrategy: null,
    landingPage: null,
    creativeStrategy: null
  };

  // Market Research
  if (marketResearch) {
    summary.marketResearch = {
      avatar: marketResearch.avatar,
      painPoints: marketResearch.painPoints,
      desires: marketResearch.desires,
      existingPurchases: marketResearch.existingPurchases,
      competitors: marketResearch.competitors
    };
  }

  // Offer
  if (offer) {
    summary.offer = {
      functionalValue: offer.functionalValue,
      emotionalValue: offer.emotionalValue,
      socialValue: offer.socialValue,
      economicValue: offer.economicValue,
      experientialValue: offer.experientialValue,
      bonuses: offer.bonuses,
      guarantees: offer.guarantees,
      urgencyTactics: offer.urgencyTactics,
      pricing: offer.pricing
    };
  }

  // Traffic Strategy
  if (trafficStrategy) {
    summary.trafficStrategy = {
      channels: trafficStrategy.channels,
      hooks: trafficStrategy.hooks,
      targetAudience: trafficStrategy.targetAudience,
      totalBudget: trafficStrategy.totalBudget
    };
  }

  // Landing Page
  if (landingPage) {
    summary.landingPage = {
      type: landingPage.type,
      leadCapture: landingPage.leadCapture,
      nurturing: landingPage.nurturing,
      headline: landingPage.headline,
      subheadline: landingPage.subheadline,
      ctaText: landingPage.ctaText
    };
  }

  // Creative Strategy
  if (creativeStrategy) {
    summary.creativeStrategy = {
      adTypes: creativeStrategy.adTypes,
      additionalNotes: creativeStrategy.additionalNotes
    };
  }

  return summary;
}

/**
 * Generate PDF content for strategy summary
 * @param {object} summary - Strategy summary object
 * @returns {object} PDF content configuration
 */
function generatePdfContent(summary) {
  const sections = [];

  // Project Info Section
  sections.push({
    title: 'Project Overview',
    content: [
      { label: 'Business Name', value: summary.project.businessName },
      { label: 'Customer Name', value: summary.project.customerName },
      { label: 'Industry', value: summary.project.industry || 'N/A' },
      { label: 'Email', value: summary.project.email },
      { label: 'Mobile', value: summary.project.mobile },
      { label: 'Budget', value: summary.project.budget ? `$${summary.project.budget.toLocaleString()}` : 'N/A' },
      { label: 'Timeline', value: summary.project.timeline?.startDate && summary.project.timeline?.endDate
        ? `${new Date(summary.project.timeline.startDate).toLocaleDateString()} - ${new Date(summary.project.timeline.endDate).toLocaleDateString()}`
        : 'N/A' }
    ]
  });

  // Market Research Section
  if (summary.marketResearch) {
    const mr = summary.marketResearch;
    sections.push({
      title: 'Market Research',
      content: [
        { label: 'Target Audience', value: mr.avatar ?
          `${mr.avatar.ageRange || ''} ${mr.avatar.profession || ''} ${mr.avatar.location || ''}`.trim() : 'N/A' },
        { label: 'Income Level', value: mr.avatar?.income || 'N/A' },
        { label: 'Interests', value: mr.avatar?.interests?.join(', ') || 'N/A' },
        { label: 'Pain Points', value: mr.painPoints?.join('\n• ') || 'N/A', isList: true },
        { label: 'Desires', value: mr.desires?.join('\n• ') || 'N/A', isList: true },
        { label: 'Existing Purchases', value: mr.existingPurchases?.join(', ') || 'N/A' },
        { label: 'Competitors', value: mr.competitors || 'N/A' }
      ]
    });
  }

  // Offer Section
  if (summary.offer) {
    const offer = summary.offer;
    sections.push({
      title: 'Offer Engineering',
      content: [
        { label: 'Functional Value', value: offer.functionalValue || 'N/A' },
        { label: 'Emotional Value', value: offer.emotionalValue || 'N/A' },
        { label: 'Social Value', value: offer.socialValue || 'N/A' },
        { label: 'Economic Value', value: offer.economicValue || 'N/A' },
        { label: 'Experiential Value', value: offer.experientialValue || 'N/A' },
        { label: 'Bonuses', value: offer.bonuses?.map(b => `${b.title} ($${b.value})`).join('\n') || 'N/A', isList: true },
        { label: 'Guarantees', value: offer.guarantees?.join('\n• ') || 'N/A', isList: true },
        { label: 'Base Price', value: offer.pricing?.basePrice ? `$${offer.pricing.basePrice.toLocaleString()}` : 'N/A' },
        { label: 'Currency', value: offer.pricing?.currency || 'USD' }
      ]
    });
  }

  // Traffic Strategy Section
  if (summary.trafficStrategy) {
    const ts = summary.trafficStrategy;
    const selectedChannels = ts.channels?.filter(c => c.isSelected)?.map(c => c.name).join(', ') || 'None selected';
    sections.push({
      title: 'Traffic Strategy',
      content: [
        { label: 'Selected Channels', value: selectedChannels },
        { label: 'Total Budget', value: ts.totalBudget ? `$${ts.totalBudget.toLocaleString()}` : 'N/A' },
        { label: 'Hooks', value: ts.hooks?.map(h => `${h.content} (${h.type})`).join('\n') || 'N/A', isList: true }
      ]
    });
  }

  // Landing Page Section
  if (summary.landingPage) {
    const lp = summary.landingPage;
    sections.push({
      title: 'Landing Page Strategy',
      content: [
        { label: 'Page Type', value: lp.type?.replace(/_/g, ' ') || 'N/A' },
        { label: 'Lead Capture Method', value: lp.leadCapture?.method || 'N/A' },
        { label: 'Headline', value: lp.headline || 'N/A' },
        { label: 'Subheadline', value: lp.subheadline || 'N/A' },
        { label: 'CTA', value: lp.ctaText || 'N/A' }
      ]
    });
  }

  // Creative Strategy Section
  if (summary.creativeStrategy) {
    const cs = summary.creativeStrategy;
    sections.push({
      title: 'Creative Strategy',
      content: [
        { label: 'Ad Types', value: cs.adTypes?.map(at => at.typeName).join(', ') || 'N/A' },
        { label: 'Additional Notes', value: cs.additionalNotes || 'N/A' }
      ]
    });

    // Add details for each ad type
    if (cs.adTypes && cs.adTypes.length > 0) {
      cs.adTypes.forEach((adType, index) => {
        if (adType.creatives) {
          sections.push({
            title: `Creative: ${adType.typeName}`,
            content: [
              { label: 'Image Creatives', value: adType.creatives.imageCreatives || 0 },
              { label: 'Video Creatives', value: adType.creatives.videoCreatives || 0 },
              { label: 'Carousel Creatives', value: adType.creatives.carouselCreatives || 0 },
              { label: 'Messaging Angle', value: adType.creatives.messagingAngle || 'N/A' },
              { label: 'Hook', value: adType.creatives.hook || 'N/A' },
              { label: 'Headline', value: adType.creatives.headline || 'N/A' },
              { label: 'CTA', value: adType.creatives.cta || 'N/A' },
              { label: 'Platforms', value: adType.creatives.platforms?.join(', ') || 'N/A' }
            ]
          });
        }
      });
    }
  }

  return sections;
}

/**
 * Generate a formatted text summary
 * @param {object} summary - Strategy summary object
 * @returns {string} Formatted text summary
 */
function generateTextSummary(summary) {
  let text = '=' .repeat(60) + '\n';
  text += 'PROJECT STRATEGY SUMMARY\n';
  text += '=' .repeat(60) + '\n\n';

  // Project Info
  text += 'PROJECT OVERVIEW\n';
  text += '-'.repeat(40) + '\n';
  text += `Business: ${summary.project.businessName}\n`;
  text += `Customer: ${summary.project.customerName}\n`;
  text += `Industry: ${summary.project.industry || 'N/A'}\n`;
  text += `Email: ${summary.project.email}\n`;
  text += `Mobile: ${summary.project.mobile}\n`;
  if (summary.project.budget) {
    text += `Budget: $${summary.project.budget.toLocaleString()}\n`;
  }
  text += '\n';

  // Market Research
  if (summary.marketResearch) {
    text += 'MARKET RESEARCH\n';
    text += '-'.repeat(40) + '\n';
    if (summary.marketResearch.avatar) {
      text += `Target Audience: ${summary.marketResearch.avatar.ageRange || ''} ${summary.marketResearch.avatar.profession || ''}\n`;
      text += `Location: ${summary.marketResearch.avatar.location || 'N/A'}\n`;
      text += `Income: ${summary.marketResearch.avatar.income || 'N/A'}\n`;
      if (summary.marketResearch.avatar.interests?.length) {
        text += `Interests: ${summary.marketResearch.avatar.interests.join(', ')}\n`;
      }
    }
    if (summary.marketResearch.painPoints?.length) {
      text += '\nPain Points:\n';
      summary.marketResearch.painPoints.forEach(p => text += `• ${p}\n`);
    }
    if (summary.marketResearch.desires?.length) {
      text += '\nDesires:\n';
      summary.marketResearch.desires.forEach(d => text += `• ${d}\n`);
    }
    text += '\n';
  }

  // Offer
  if (summary.offer) {
    text += 'OFFER ENGINEERING\n';
    text += '-'.repeat(40) + '\n';
    text += `Functional Value: ${summary.offer.functionalValue || 'N/A'}\n`;
    text += `Emotional Value: ${summary.offer.emotionalValue || 'N/A'}\n`;
    text += `Social Value: ${summary.offer.socialValue || 'N/A'}\n`;
    text += `Economic Value: ${summary.offer.economicValue || 'N/A'}\n`;
    text += `Experiential Value: ${summary.offer.experientialValue || 'N/A'}\n`;
    if (summary.offer.pricing?.basePrice) {
      text += `Price: $${summary.offer.pricing.basePrice.toLocaleString()} ${summary.offer.pricing.currency || 'USD'}\n`;
    }
    text += '\n';
  }

  // Traffic Strategy
  if (summary.trafficStrategy) {
    text += 'TRAFFIC STRATEGY\n';
    text += '-'.repeat(40) + '\n';
    const channels = summary.trafficStrategy.channels?.filter(c => c.isSelected)?.map(c => c.name);
    if (channels?.length) {
      text += `Channels: ${channels.join(', ')}\n`;
    }
    if (summary.trafficStrategy.totalBudget) {
      text += `Budget: $${summary.trafficStrategy.totalBudget.toLocaleString()}\n`;
    }
    if (summary.trafficStrategy.hooks?.length) {
      text += '\nHooks:\n';
      summary.trafficStrategy.hooks.forEach(h => text += `• ${h.content} (${h.type})\n`);
    }
    text += '\n';
  }

  // Landing Page
  if (summary.landingPage) {
    text += 'LANDING PAGE STRATEGY\n';
    text += '-'.repeat(40) + '\n';
    text += `Type: ${summary.landingPage.type?.replace(/_/g, ' ') || 'N/A'}\n`;
    text += `Lead Capture: ${summary.landingPage.leadCapture?.method || 'N/A'}\n`;
    text += `Headline: ${summary.landingPage.headline || 'N/A'}\n`;
    text += `CTA: ${summary.landingPage.ctaText || 'N/A'}\n\n`;
  }

  // Creative Strategy
  if (summary.creativeStrategy) {
    text += 'CREATIVE STRATEGY\n';
    text += '-'.repeat(40) + '\n';
    if (summary.creativeStrategy.adTypes?.length) {
      text += 'Ad Types:\n';
      summary.creativeStrategy.adTypes.forEach(at => {
        text += `\n${at.typeName}:\n`;
        if (at.creatives) {
          text += `  Images: ${at.creatives.imageCreatives || 0}\n`;
          text += `  Videos: ${at.creatives.videoCreatives || 0}\n`;
          text += `  Carousels: ${at.creatives.carouselCreatives || 0}\n`;
          text += `  Platforms: ${at.creatives.platforms?.join(', ') || 'N/A'}\n`;
          if (at.creatives.hook) text += `  Hook: ${at.creatives.hook}\n`;
          if (at.creatives.headline) text += `  Headline: ${at.creatives.headline}\n`;
          if (at.creatives.cta) text += `  CTA: ${at.creatives.cta}\n`;
        }
      });
    }
  }

  text += '\n' + '='.repeat(60) + '\n';
  text += `Generated: ${new Date().toLocaleString()}\n`;

  return text;
}

/**
 * Generate context for AI prompts (condensed version)
 * @param {object} summary - Strategy summary object
 * @returns {object} Condensed context for tasks
 */
function generateTaskContext(summary) {
  return {
    client: {
      businessName: summary.project.businessName,
      customerName: summary.project.customerName,
      industry: summary.project.industry,
      description: summary.project.description
    },
    targetAudience: summary.marketResearch?.avatar ? {
      ageRange: summary.marketResearch.avatar.ageRange,
      profession: summary.marketResearch.avatar.profession,
      location: summary.marketResearch.avatar.location,
      income: summary.marketResearch.avatar.income,
      interests: summary.marketResearch.avatar.interests
    } : null,
    painPoints: summary.marketResearch?.painPoints || [],
    desires: summary.marketResearch?.desires || [],
    offer: {
      functionalValue: summary.offer?.functionalValue,
      emotionalValue: summary.offer?.emotionalValue,
      pricing: summary.offer?.pricing
    },
    hooks: summary.trafficStrategy?.hooks?.map(h => ({ content: h.content, type: h.type })) || [],
    channels: summary.trafficStrategy?.channels?.filter(c => c.isSelected)?.map(c => c.name) || [],
    landingPage: summary.landingPage ? {
      type: summary.landingPage.type,
      headline: summary.landingPage.headline,
      cta: summary.landingPage.ctaText
    } : null,
    creativeStrategy: summary.creativeStrategy ? {
      adTypes: summary.creativeStrategy.adTypes?.map(at => ({
        typeName: at.typeName,
        platforms: at.creatives?.platforms,
        hook: at.creatives?.hook,
        headline: at.creatives?.headline,
        cta: at.creatives?.cta
      })),
      additionalNotes: summary.creativeStrategy.additionalNotes
    } : null
  };
}

module.exports = {
  getStrategySummary,
  generatePdfContent,
  generateTextSummary,
  generateTaskContext
};