import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, Plus, X, CheckCircle } from 'lucide-react';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Mock project data with offer engineering completed
const STATIC_PROJECT = {
  _id: 'static-project-1',
  customerName: 'John Smith',
  businessName: 'Acme Corporation',
  email: 'john@acme.com',
  mobile: '+1-555-0123',
  currentStage: 4,
  overallProgress: 50,
  stages: {
    onboarding: { isCompleted: true, completedAt: new Date() },
    marketResearch: { isCompleted: true, completedAt: new Date() },
    offerEngineering: { isCompleted: true, completedAt: new Date() },
    trafficStrategy: { isCompleted: false, completedAt: null },
    landingPage: { isCompleted: false, completedAt: null },
    creativeStrategy: { isCompleted: false, completedAt: null }
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

const CHANNELS = [
  { id: 'meta_ads', label: 'Meta Ads', icon: '📘' },
  { id: 'google_ads', label: 'Google Ads', icon: '🔍' },
  { id: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼' },
  { id: 'youtube_ads', label: 'YouTube Ads', icon: '▶️' },
  { id: 'podcasts', label: 'Podcasts', icon: '🎙️' },
  { id: 'organic', label: 'Organic', icon: '🌱' },
  { id: 'radio', label: 'Radio', icon: '📻' },
  { id: 'offline_ads', label: 'Offline Ads', icon: '📺' },
];

// Mock traffic strategy data
const STATIC_TRAFFIC = {
  channels: [
    { name: 'meta_ads', isSelected: true, justification: 'Best for targeting our demographic with visual ads' },
    { name: 'google_ads', isSelected: true, justification: 'High intent search traffic' },
  ],
  hooks: [
    { content: 'Why 90% of startups fail in the first year', type: 'curiosity' },
    { content: 'Stop wasting money on ads that don\'t convert', type: 'pain_point' },
  ],
  totalBudget: 5000,
  isCompleted: false
};

export default function TrafficStrategyPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [channels, setChannels] = useState(CHANNELS.map(c => ({ ...c, isSelected: false, justification: '' })));
  const [hooks, setHooks] = useState([]);
  const [newHook, setNewHook] = useState('');
  const [hookType, setHookType] = useState('curiosity');
  const [budget, setBudget] = useState(0);

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (USE_STATIC_DATA) {
        // Use static data for development
        setProject(STATIC_PROJECT);
        setChannels(CHANNELS.map(c => {
          const existing = STATIC_TRAFFIC.channels?.find(ch => ch.name === c.id);
          return {
            ...c,
            isSelected: existing?.isSelected || false,
            justification: existing?.justification || '',
          };
        }));
        setHooks(STATIC_TRAFFIC.hooks || []);
        setBudget(STATIC_TRAFFIC.totalBudget || 0);
        setIsCompleted(STATIC_TRAFFIC.isCompleted);
      } else {
        // Real API calls
        const { projectService, trafficStrategyService } = await import('@/services/api');
        const [projectRes, trafficRes] = await Promise.all([
          projectService.getProject(projectId),
          trafficStrategyService.get(projectId),
        ]);
        setProject(projectRes.data);

        if (trafficRes.data) {
          setChannels(CHANNELS.map(c => {
            const existing = trafficRes.data.channels?.find(ch => ch.name === c.id);
            return {
              ...c,
              isSelected: existing?.isSelected || false,
              justification: existing?.justification || '',
            };
          }));
          setHooks(trafficRes.data.hooks || []);
          setBudget(trafficRes.data.totalBudget || 0);
          setIsCompleted(trafficRes.data.isCompleted);
        }
      }
    } catch (error) {
      // Only show error for actual failures
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load traffic strategy';
      const statusCode = error?.response?.status || error?.status;

      console.error('Traffic strategy fetch error:', error);

      if (statusCode === 403) {
        toast.error('Complete Offer Engineering first to access Traffic Strategy');
        navigate('/projects');
      } else if (statusCode === 404) {
        toast.error('Project not found');
        navigate('/projects');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (channelId) => {
    setChannels(channels.map(c =>
      c.id === channelId ? { ...c, isSelected: !c.isSelected } : c
    ));
  };

  const updateJustification = (channelId, justification) => {
    setChannels(channels.map(c =>
      c.id === channelId ? { ...c, justification } : c
    ));
  };

  const addHook = () => {
    if (!newHook.trim()) return;
    setHooks([...hooks, { content: newHook.trim(), type: hookType }]);
    setNewHook('');
  };

  const removeHook = (index) => {
    setHooks(hooks.filter((_, i) => i !== index));
  };

  const onSubmit = async (markComplete = false) => {
    try {
      setSaving(true);

      if (USE_STATIC_DATA) {
        // Static mode - simulate save
        await new Promise(resolve => setTimeout(resolve, 500));
        if (markComplete) {
          setIsCompleted(true);
          setProject(prev => ({
            ...prev,
            stages: {
              ...prev.stages,
              trafficStrategy: { isCompleted: true, completedAt: new Date() }
            },
            currentStage: 5,
            overallProgress: 67
          }));
          toast.success('Traffic strategy completed! Moving to Landing Pages...');
          setTimeout(() => {
            navigate(`/landing-pages?projectId=${projectId}`);
          }, 1500);
        } else {
          toast.success('Progress saved!');
        }
      } else {
        // Real API call
        const { trafficStrategyService } = await import('@/services/api');
        await trafficStrategyService.upsert(projectId, {
          channels: channels.map(c => ({
            name: c.id,
            isSelected: c.isSelected,
            justification: c.justification,
          })),
          hooks,
          totalBudget: budget,
          isCompleted: markComplete,
        });
        toast.success(markComplete ? 'Traffic strategy completed!' : 'Progress saved!');
        if (markComplete) {
          navigate(`/landing-pages?projectId=${projectId}`);
        }
      }
    } catch (error) {
      console.error('Traffic strategy save error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to save traffic strategy';
      toast.error(errorMessage);
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

  // Calculate progress
  const selectedChannels = channels.filter(c => c.isSelected).length;
  const progress = Math.round(((selectedChannels > 0 ? 1 : 0) + (hooks.length > 0 ? 1 : 0) + (budget > 0 ? 1 : 0)) / 3 * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Traffic Strategy</h1>
          <p className="text-gray-600 mt-1">{project?.businessName}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="text-2xl font-bold text-primary-600">
            {isCompleted ? '100%' : `${progress}%`}
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-800">Stage Completed!</h3>
            <p className="text-sm text-green-600">You can now proceed to Landing Pages.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      {/* Traffic Channels */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Traffic Channels</h2>
          <p className="text-sm text-gray-500">Select the channels you'll use to drive traffic</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  channel.isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleChannel(channel.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{channel.icon}</span>
                  <span className="font-medium">{channel.label}</span>
                </div>
                {channel.isSelected && (
                  <Textarea
                    placeholder="Why this channel?"
                    rows={2}
                    value={channel.justification}
                    onChange={(e) => updateJustification(channel.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Hooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">3-Second Hooks</h2>
              <p className="text-sm text-gray-500">Create attention-grabbing hooks for your ads</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g., Why 90% of startups fail in the first year"
              value={newHook}
              onChange={(e) => setNewHook(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addHook();
                }
              }}
              className="flex-1"
            />
            <select
              value={hookType}
              onChange={(e) => setHookType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="curiosity">Curiosity</option>
              <option value="pain_point">Pain Point</option>
              <option value="benefit">Benefit</option>
              <option value="story">Story</option>
              <option value="statistic">Statistic</option>
            </select>
            <Button type="button" onClick={addHook}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {hooks.map((hook, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="text-gray-900">{hook.content}</span>
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded-full capitalize">
                    {hook.type.replace('_', ' ')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeHook(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Total Budget</h2>
          <p className="text-sm text-gray-500">Set your overall traffic budget</p>
        </CardHeader>
        <CardBody>
          <div className="max-w-xs">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {!isCompleted ? (
          <>
            <Button variant="secondary" onClick={() => onSubmit(false)} loading={saving}>
              Save Progress
            </Button>
            <Button onClick={() => onSubmit(true)} loading={saving}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete & Continue
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate(`/landing-pages?projectId=${projectId}`)}>
            Continue to Landing Pages
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        )}
      </div>
    </div>
  );
}