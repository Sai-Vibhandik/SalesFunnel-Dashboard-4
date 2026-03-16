import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Spinner, Badge } from '@/components/ui';
import { projectService, marketResearchService, offerService, trafficStrategyService, creativeService } from '@/services/api';
import {
  Users, Target, Gift, TrendingUp, Lightbulb, FileText,
  CheckCircle, AlertCircle, Eye, Palette, Code
} from 'lucide-react';

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  google: 'Google',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'Twitter/X',
  whatsapp: 'WhatsApp'
};

const FUNNEL_STAGE_LABELS = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
  retargeting: 'Retargeting',
  influencer_ads: 'Influencer Ads',
  engagement: 'Engagement'
};

export default function ProjectSummary({ projectId, compact = false }) {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [marketResearch, setMarketResearch] = useState(null);
  const [offer, setOffer] = useState(null);
  const [trafficStrategy, setTrafficStrategy] = useState(null);
  const [creativeStrategy, setCreativeStrategy] = useState(null);
  const [landingPage, setLandingPage] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [projectId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);

      // Fetch all strategy data in parallel
      const [projectRes, mrRes, offerRes, trafficRes, creativeRes] = await Promise.all([
        projectService.getProject(projectId),
        marketResearchService.get(projectId).catch(() => ({ data: null })),
        offerService.get(projectId).catch(() => ({ data: null })),
        trafficStrategyService.get(projectId).catch(() => ({ data: null })),
        creativeService.get(projectId).catch(() => ({ data: null }))
      ]);

      setProject(projectRes.data);
      setMarketResearch(mrRes.data);
      setOffer(offerRes.data);
      setTrafficStrategy(trafficRes.data);
      setCreativeStrategy(creativeRes.data);
      // Landing pages are now embedded in project document
      // Get the first landing page for summary display (if any)
      setLandingPage(projectRes.data.landingPages?.[0] || null);
    } catch (error) {
      console.error('Failed to load project summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Project Info */}
        <Card>
          <CardHeader className="bg-gray-50">
            <h3 className="font-semibold text-gray-900">Project Overview</h3>
          </CardHeader>
          <CardBody className="p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Business:</span>
                <span className="ml-2 font-medium">{project.businessName}</span>
              </div>
              <div>
                <span className="text-gray-500">Industry:</span>
                <span className="ml-2 font-medium">{project.industry || 'N/A'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Target Audience */}
        {marketResearch?.avatar && (
          <Card>
            <CardHeader className="bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Target Audience
              </h3>
            </CardHeader>
            <CardBody className="p-4">
              <div className="space-y-2 text-sm">
                {marketResearch.avatar.ageRange && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age:</span>
                    <span className="font-medium">{marketResearch.avatar.ageRange}</span>
                  </div>
                )}
                {marketResearch.avatar.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium">{marketResearch.avatar.location}</span>
                  </div>
                )}
                {marketResearch.avatar.profession && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profession:</span>
                    <span className="font-medium">{marketResearch.avatar.profession}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Pain Points & Desires */}
        {(marketResearch?.painPoints?.length > 0 || marketResearch?.desires?.length > 0) && (
          <Card>
            <CardBody className="p-4 space-y-3">
              {marketResearch.painPoints?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-red-600 uppercase mb-1">Pain Points</h4>
                  <ul className="text-sm space-y-1">
                    {marketResearch.painPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {marketResearch.desires?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-green-600 uppercase mb-1">Desires</h4>
                  <ul className="text-sm space-y-1">
                    {marketResearch.desires.slice(0, 3).map((desire, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{desire}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Offer Summary */}
        {offer?.functionalValue && (
          <Card>
            <CardHeader className="bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Offer
              </h3>
            </CardHeader>
            <CardBody className="p-4">
              <p className="text-sm text-gray-700">{offer.functionalValue}</p>
              {offer.emotionalValue && (
                <p className="text-sm text-gray-600 mt-2">{offer.emotionalValue}</p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Creative Strategy */}
        {creativeStrategy?.adTypes?.length > 0 && (
          <Card>
            <CardHeader className="bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Creative Types
              </h3>
            </CardHeader>
            <CardBody className="p-4">
              <div className="flex flex-wrap gap-2">
                {creativeStrategy.adTypes.map((adType, i) => (
                  <Badge key={i} variant="primary">
                    {adType.typeName}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Project Summary
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Read-only overview of project strategy and context
          </p>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500">Business Name</label>
              <p className="mt-1 font-medium text-gray-900">{project.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Industry</label>
              <p className="mt-1 font-medium text-gray-900">{project.industry || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Customer</label>
              <p className="mt-1 font-medium text-gray-900">{project.customerName}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Target Audience */}
      {marketResearch?.avatar && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Target Audience
            </h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {marketResearch.avatar.ageRange && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Age Range</label>
                  <p className="mt-1 font-medium text-gray-900">{marketResearch.avatar.ageRange}</p>
                </div>
              )}
              {marketResearch.avatar.location && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Location</label>
                  <p className="mt-1 font-medium text-gray-900">{marketResearch.avatar.location}</p>
                </div>
              )}
              {marketResearch.avatar.profession && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Profession</label>
                  <p className="mt-1 font-medium text-gray-900">{marketResearch.avatar.profession}</p>
                </div>
              )}
              {marketResearch.avatar.income && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Income</label>
                  <p className="mt-1 font-medium text-gray-900">{marketResearch.avatar.income}</p>
                </div>
              )}
              {marketResearch.avatar.interests?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <label className="text-xs text-gray-500 uppercase">Interests</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {marketResearch.avatar.interests.map((interest, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pain Points & Desires */}
      {(marketResearch?.painPoints?.length > 0 || marketResearch?.desires?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {marketResearch.painPoints?.length > 0 && (
            <Card>
              <CardHeader className="bg-red-50">
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Pain Points
                </h3>
              </CardHeader>
              <CardBody className="p-4">
                <ul className="space-y-2">
                  {marketResearch.painPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {marketResearch.desires?.length > 0 && (
            <Card>
              <CardHeader className="bg-green-50">
                <h3 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Customer Desires
                </h3>
              </CardHeader>
              <CardBody className="p-4">
                <ul className="space-y-2">
                  {marketResearch.desires.map((desire, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{desire}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Offer */}
      {offer && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Value Proposition & Offer
            </h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Functional Value</label>
                <p className="text-gray-900">{offer.functionalValue || 'Not defined'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">Emotional Value</label>
                <p className="text-gray-900">{offer.emotionalValue || 'Not defined'}</p>
              </div>
              {offer.bonuses?.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500 block mb-2">Bonuses</label>
                  <div className="flex flex-wrap gap-2">
                    {offer.bonuses.map((bonus, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        {bonus.title || bonus}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Traffic Strategy */}
      {trafficStrategy && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Traffic Strategy
            </h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4">
              {/* Channels */}
              {trafficStrategy.channels?.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500 block mb-2">Selected Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {trafficStrategy.channels
                      .filter(c => c.isSelected)
                      .map((channel, i) => (
                        <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                          {PLATFORM_LABELS[channel.name] || channel.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {/* Hooks */}
              {trafficStrategy.hooks?.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500 block mb-2">Hooks</label>
                  <ul className="space-y-1">
                    {trafficStrategy.hooks.map((hook, i) => (
                      <li key={i} className="text-gray-700 text-sm">
                        {hook.content || hook}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Creative Strategy */}
      {creativeStrategy?.adTypes?.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Creative Strategy
            </h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="space-y-4">
              {creativeStrategy.adTypes.map((adType, i) => (
                <div key={i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {FUNNEL_STAGE_LABELS[adType.typeKey] || adType.typeName}
                    </h4>
                    <Badge variant="primary">{adType.typeName}</Badge>
                  </div>
                  {adType.creatives && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {adType.creatives.platforms?.length > 0 && (
                        <div>
                          <span className="text-gray-500">Platforms:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {adType.creatives.platforms.map((p, j) => (
                              <span key={j} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                {PLATFORM_LABELS[p] || p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {adType.creatives.hook && (
                        <div>
                          <span className="text-gray-500">Hook:</span>
                          <p className="mt-1 font-medium">{adType.creatives.hook}</p>
                        </div>
                      )}
                      {adType.creatives.headline && (
                        <div>
                          <span className="text-gray-500">Headline:</span>
                          <p className="mt-1 font-medium">{adType.creatives.headline}</p>
                        </div>
                      )}
                      {adType.creatives.cta && (
                        <div>
                          <span className="text-gray-500">CTA:</span>
                          <p className="mt-1 font-medium text-green-700">{adType.creatives.cta}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="text-gray-500">Creatives:</span>{' '}
                    {adType.creatives?.imageCreatives || 0} images,{' '}
                    {adType.creatives?.videoCreatives || 0} videos,{' '}
                    {adType.creatives?.carouselCreatives || 0} carousels
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Landing Page */}
      {landingPage && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-500" />
              Landing Page Strategy
            </h3>
          </CardHeader>
          <CardBody className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">Type</label>
                <p className="mt-1 font-medium text-gray-900">
                  {landingPage.funnelType?.replace(/_/g, ' ') || 'Not specified'}
                </p>
              </div>
              {landingPage.headline && (
                <div>
                  <label className="text-sm text-gray-500">Headline</label>
                  <p className="mt-1 font-medium text-gray-900">{landingPage.headline}</p>
                </div>
              )}
              {landingPage.leadCaptureMethod && (
                <div>
                  <label className="text-sm text-gray-500">Lead Capture</label>
                  <p className="mt-1 font-medium text-gray-900">{landingPage.leadCaptureMethod}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}