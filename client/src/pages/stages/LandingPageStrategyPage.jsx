import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { projectService } from '@/services/api';

const LANDING_PAGE_TYPES = [
  { id: 'video_sales_letter', label: 'Video Sales Letter', icon: '🎥' },
  { id: 'long_form', label: 'Long-form Page', icon: '📄' },
  { id: 'lead_magnet', label: 'Lead Magnet', icon: '🧲' },
  { id: 'ebook', label: 'Ebook Page', icon: '📚' },
  { id: 'webinar', label: 'Webinar Page', icon: '🖥️' },
];

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'google', label: 'Google Ads' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'multi', label: 'Multi-Platform' },
];

const LEAD_CAPTURE_METHODS = [
  { id: 'form', label: 'Form', icon: '📝' },
  { id: 'calendly', label: 'Calendly', icon: '📅' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'free_audit', label: 'Free Audit', icon: '🔍' },
];

export default function LandingPageStrategyPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const landingPageId = searchParams.get('landingPageId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [funnelType, setFunnelType] = useState('video_sales_letter');
  const [hook, setHook] = useState('');
  const [angle, setAngle] = useState('');
  const [platform, setPlatform] = useState('facebook');
  const [cta, setCta] = useState('');
  const [offer, setOffer] = useState('');
  const [messaging, setMessaging] = useState('');
  const [leadCaptureMethod, setLeadCaptureMethod] = useState('form');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    fetchData();
  }, [projectId, landingPageId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const projectRes = await projectService.getProject(projectId);
      setProject(projectRes.data);

      // Check if traffic strategy is completed
      if (!projectRes.data.stages?.trafficStrategy?.isCompleted) {
        toast.error('Complete Traffic Strategy first to access Landing Pages');
        navigate('/projects');
        return;
      }

      if (landingPageId) {
        // Load specific landing page from embedded array
        const lp = projectRes.data.landingPages?.find(lp => lp._id === landingPageId);
        if (lp) {
          setName(lp.name || '');
          setFunnelType(lp.funnelType || 'video_sales_letter');
          setHook(lp.hook || '');
          setAngle(lp.angle || '');
          setPlatform(lp.platform || 'facebook');
          setCta(lp.cta || '');
          setOffer(lp.offer || '');
          setMessaging(lp.messaging || '');
          setLeadCaptureMethod(lp.leadCaptureMethod || 'form');
          setHeadline(lp.headline || '');
          setSubheadline(lp.subheadline || '');
        } else {
          toast.error('Landing page not found');
          navigate(`/landing-pages?projectId=${projectId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error?.message || 'Failed to load landing page';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a landing page name');
      return;
    }

    try {
      setSaving(true);

      const landingPageData = {
        name,
        funnelType,
        hook,
        angle,
        platform,
        cta,
        offer,
        messaging,
        leadCaptureMethod,
        headline,
        subheadline,
      };

      if (landingPageId) {
        // Update existing
        await projectService.updateLandingPage(projectId, landingPageId, landingPageData);
      } else {
        // Create new
        await projectService.addLandingPage(projectId, landingPageData);
      }

      toast.success('Landing page saved!');

      // Navigate back to landing pages list
      navigate(`/landing-pages?projectId=${projectId}`);
    } catch (error) {
      console.error('Error saving landing page:', error);
      toast.error(error?.message || 'Failed to save landing page');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    // Save first if there are unsaved changes
    if (!name.trim()) {
      toast.error('Please enter a landing page name before continuing');
      return;
    }

    try {
      setSaving(true);

      const landingPageData = {
        name,
        funnelType,
        hook,
        angle,
        platform,
        cta,
        offer,
        messaging,
        leadCaptureMethod,
        headline,
        subheadline,
      };

      if (landingPageId) {
        await projectService.updateLandingPage(projectId, landingPageId, landingPageData);
      }

      // Mark landing page stage as complete
      try {
        await projectService.completeLandingPageStage(projectId);
        toast.success('Landing page stage completed!');
      } catch (completeError) {
        // Continue even if completion fails - backend allows access if landing pages exist
        console.error('Error completing stage:', completeError);
      }

      // Navigate to creative strategy - no task generation
      navigate(`/creative-strategy?projectId=${projectId}`);
    } catch (error) {
      console.error('Error saving landing page:', error);
      toast.error(error?.message || 'Failed to save landing page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/landing-pages?projectId=${projectId}`)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {name || 'Landing Page Strategy'}
          </h1>
          <p className="text-gray-600 mt-1">{project?.businessName}</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-500">Name and platform for this landing page</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Landing Page Name"
            placeholder="e.g., Main Landing Page, Campaign A, etc."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Funnel Type</label>
              <select
                value={funnelType}
                onChange={(e) => setFunnelType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {LANDING_PAGE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Strategy Fields */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Strategy</h2>
          <p className="text-sm text-gray-500">Define the hook and angle for this landing page</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Textarea
            label="Hook"
            placeholder="What's the main hook that grabs attention?"
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            rows={2}
          />
          <Textarea
            label="Angle"
            placeholder="What's the creative angle or approach?"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            rows={2}
          />
          <Input
            label="Call-to-Action (CTA)"
            placeholder="e.g., Get Started Now"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
          />
          <Input
            label="Offer"
            placeholder="What's the main offer?"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
          />
          <Textarea
            label="Messaging"
            placeholder="Key messaging and talking points"
            value={messaging}
            onChange={(e) => setMessaging(e.target.value)}
            rows={3}
          />
        </CardBody>
      </Card>

      {/* Lead Capture Method */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Lead Capture Method</h2>
          <p className="text-sm text-gray-500">How will you capture leads?</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEAD_CAPTURE_METHODS.map((method) => (
              <div
                key={method.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  leadCaptureMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setLeadCaptureMethod(method.id)}
              >
                <span className="text-2xl">{method.icon}</span>
                <p className="mt-2 font-medium">{method.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Page Content */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Page Content</h2>
          <p className="text-sm text-gray-500">Define your landing page content</p>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Headline"
            placeholder="Your main headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <Input
            label="Subheadline"
            placeholder="Supporting headline"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
          />
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <Button variant="secondary" onClick={() => navigate(`/landing-pages?projectId=${projectId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Landing Pages
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onSave} loading={saving}>
            Save
          </Button>
          <Button onClick={handleContinue} loading={saving}>
            Continue to Creative Strategy
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}