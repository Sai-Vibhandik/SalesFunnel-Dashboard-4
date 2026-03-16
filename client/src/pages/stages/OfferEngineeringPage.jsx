import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, Plus, X, CheckCircle, Lightbulb } from 'lucide-react';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Predefined suggestions for quick selection
const VALUE_SUGGESTIONS = {
  functional: [
    'Automates repetitive marketing tasks saving 10+ hours per week',
    'Provides real-time analytics and performance tracking',
    'Integrates with existing tools (CRM, email, ads platforms)',
    'Generates qualified leads on autopilot',
    'Streamlines customer communication workflows',
    'Creates professional landing pages in minutes',
    'Manages multiple marketing channels from one dashboard',
    'Tracks ROI and campaign performance automatically',
    'Simplifies A/B testing and optimization',
    'Provides templates for emails, ads, and landing pages',
  ],
  emotional: [
    'Feel confident and in control of your marketing efforts',
    'Experience peace of mind knowing everything is automated',
    'Feel proud of your professional marketing presence',
    'Gain confidence in your ability to scale your business',
    'Feel empowered to make data-driven decisions',
    'Experience relief from marketing overwhelm',
    'Feel successful as you see real results',
    'Gain certainty about your marketing strategy',
    'Feel accomplished as you hit your goals',
    'Experience freedom from constant marketing worries',
  ],
  social: [
    'Join a community of successful marketers and entrepreneurs',
    'Gain recognition as a thought leader in your industry',
    'Share your success story with like-minded peers',
    'Build credibility with professional marketing assets',
    'Network with other successful business owners',
    'Get featured in our customer success stories',
    'Receive certification that boosts your professional profile',
    'Connect with industry experts and mentors',
    'Build authority in your niche with proven results',
    'Showcase your achievements to clients and partners',
  ],
  economic: [
    'Average ROI of 300% within the first 90 days',
    'Reduce marketing costs by 40% while increasing results',
    'Save $50,000+ annually on marketing tools and staff',
    'Generate 3x more leads with the same budget',
    'Increase conversion rates by 50% or more',
    'Cut customer acquisition cost in half',
    'Achieve break-even within 30 days',
    'Turn marketing from cost center to profit center',
    'Predictable revenue growth month over month',
    'Scale revenue without scaling costs proportionally',
  ],
  experiential: [
    'Seamless onboarding with dedicated support team',
    'Personalized setup call to configure your account',
    'Step-by-step video tutorials and documentation',
    'Weekly live training sessions and Q&A calls',
    '1-on-1 strategy sessions with marketing experts',
    'VIP concierge support for premium members',
    'Annual in-person mastermind event access',
    'Private Slack/Discord community access',
    'Monthly strategy review calls',
    'Priority support with 2-hour response time',
  ],
};

const BONUS_SUGGESTIONS = [
  { title: 'Marketing Templates Pack', description: '50+ proven templates for emails, ads, and landing pages', value: 297 },
  { title: 'Private Community Access', description: 'Lifetime access to our exclusive marketing community', value: 997 },
  { title: 'Weekly Live Q&A Sessions', description: 'Join our weekly live calls for personalized guidance', value: 497 },
  { title: 'ROI Calculator Spreadsheet', description: 'Custom spreadsheet to track and calculate your marketing ROI', value: 97 },
  { title: 'Email Sequence Templates', description: '10 pre-written email sequences for different funnels', value: 197 },
  { title: 'Ad Copy Swipe File', description: '100+ high-converting ad copy examples', value: 147 },
  { title: 'Landing Page Templates', description: '20 high-converting landing page templates', value: 297 },
  { title: 'Customer Avatar Template', description: 'Detailed customer avatar worksheet and template', value: 47 },
  { title: 'Competitor Analysis Template', description: 'Framework for analyzing and outperforming competitors', value: 97 },
  { title: 'Launch Checklist', description: 'Complete step-by-step launch checklist and timeline', value: 67 },
];

const GUARANTEE_SUGGESTIONS = [
  '30-day money-back guarantee - no questions asked',
  '60-day results guarantee - get results or your money back',
  '100% satisfaction guarantee',
  'Risk-free trial for 14 days',
  'Double your leads in 90 days or we work for free',
  'Lifetime satisfaction guarantee',
  '90-day no-risk trial',
  'We don\'t get paid until you see results',
  'Full refund if not satisfied within 60 days',
  'Performance-based guarantee with milestones',
];

const URGENCY_SUGGESTIONS = [
  'Limited time offer - expires in 48 hours',
  'Only 50 spots available at this price',
  'Price increases by $500 after this week',
  'Bonus expires midnight tonight',
  'Early bird pricing ends soon',
  'Limited bonus availability for first 100 buyers',
  'Special launch pricing - price goes up Friday',
  'Fast-action bonus for first 50 orders',
  'Inventory limited - secure your spot now',
  'Offer expires when timer hits zero',
];

// Mock project data with market research completed
const STATIC_PROJECT = {
  _id: 'static-project-1',
  customerName: 'John Smith',
  businessName: 'Acme Corporation',
  email: 'john@acme.com',
  mobile: '+1-555-0123',
  currentStage: 3,
  overallProgress: 33,
  stages: {
    onboarding: { isCompleted: true, completedAt: new Date() },
    marketResearch: { isCompleted: true, completedAt: new Date() },
    offerEngineering: { isCompleted: false, completedAt: null },
    trafficStrategy: { isCompleted: false, completedAt: null },
    landingPage: { isCompleted: false, completedAt: null },
    creativeStrategy: { isCompleted: false, completedAt: null }
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock offer data
const STATIC_OFFER = {
  functionalValues: ['Our platform helps businesses automate their marketing funnels, saving 20+ hours per week on manual tasks.'],
  emotionalValues: ['Feel confident and in control of your marketing, knowing everything is running smoothly without constant oversight.'],
  socialValues: ['Join a community of successful marketers who have scaled their businesses using our proven system.'],
  economicValues: ['Average ROI of 300% within the first 90 days, with reduced ad spend and higher conversion rates.'],
  experientialValues: ['Seamless onboarding experience with dedicated support and step-by-step guidance.'],
  bonuses: [
    { title: 'Marketing Templates Pack', description: '50+ proven templates for emails, ads, and landing pages', value: 297 },
    { title: 'Private Community Access', description: 'Lifetime access to our exclusive marketing community', value: 997 }
  ],
  guarantees: ['30-day money-back guarantee', 'Results guarantee - if you don\'t see results, we\'ll work with you personally'],
  urgencyTactics: ['Limited bonus availability', 'Price increases after launch period'],
  pricing: {
    basePrice: 1997,
    currency: 'USD',
    upsell: { enabled: true, price: 497, description: 'VIP coaching package with 1-on-1 support' },
    crossSell: { enabled: true, price: 197, description: 'Advanced analytics dashboard' }
  },
  completionPercentage: 40,
  isCompleted: false
};

export default function OfferEngineeringPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [newGuarantee, setNewGuarantee] = useState('');
  const [newUrgency, setNewUrgency] = useState('');
  const [newFunctional, setNewFunctional] = useState('');
  const [newEmotional, setNewEmotional] = useState('');
  const [newSocial, setNewSocial] = useState('');
  const [newEconomic, setNewEconomic] = useState('');
  const [newExperiential, setNewExperiential] = useState('');

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    defaultValues: {
      functionalValues: [],
      emotionalValues: [],
      socialValues: [],
      economicValues: [],
      experientialValues: [],
      bonuses: [],
      guarantees: [],
      urgencyTactics: [],
      pricing: {
        basePrice: 0,
        currency: 'USD',
      },
    },
  });

  const { fields: bonusFields, append: appendBonus, remove: removeBonus } = useFieldArray({
    control,
    name: 'bonuses',
  });

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
        setValue('functionalValues', STATIC_OFFER.functionalValues || []);
        setValue('emotionalValues', STATIC_OFFER.emotionalValues || []);
        setValue('socialValues', STATIC_OFFER.socialValues || []);
        setValue('economicValues', STATIC_OFFER.economicValues || []);
        setValue('experientialValues', STATIC_OFFER.experientialValues || []);
        setValue('bonuses', STATIC_OFFER.bonuses);
        setValue('guarantees', STATIC_OFFER.guarantees);
        setValue('urgencyTactics', STATIC_OFFER.urgencyTactics);
        setValue('pricing', STATIC_OFFER.pricing);
        setIsCompleted(STATIC_OFFER.isCompleted);
      } else {
        // Real API calls
        const { projectService, offerService } = await import('@/services/api');
        const [projectRes, offerRes] = await Promise.all([
          projectService.getProject(projectId),
          offerService.get(projectId),
        ]);
        setProject(projectRes.data);

        if (offerRes.data) {
          setValue('functionalValues', offerRes.data.functionalValues || []);
          setValue('emotionalValues', offerRes.data.emotionalValues || []);
          setValue('socialValues', offerRes.data.socialValues || []);
          setValue('economicValues', offerRes.data.economicValues || []);
          setValue('experientialValues', offerRes.data.experientialValues || []);
          setValue('bonuses', offerRes.data.bonuses || []);
          setValue('guarantees', offerRes.data.guarantees || []);
          setValue('urgencyTactics', offerRes.data.urgencyTactics || []);
          setValue('pricing', offerRes.data.pricing || { basePrice: 0, currency: 'USD' });
          setIsCompleted(offerRes.data.isCompleted);
        }
      }
    } catch (error) {
      // Only show error for actual failures
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load offer';
      const statusCode = error?.response?.status || error?.status;

      console.error('Offer fetch error:', error);

      if (statusCode === 403) {
        toast.error('Complete Market Research first to access Offer Engineering');
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

  const onSubmit = async (formData, markComplete = false) => {
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
              offerEngineering: { isCompleted: true, completedAt: new Date() }
            },
            currentStage: 4,
            overallProgress: 50
          }));
          toast.success('Offer engineering completed! Moving to Traffic Strategy...');
          setTimeout(() => {
            navigate(`/traffic-strategy?projectId=${projectId}`);
          }, 1500);
        } else {
          toast.success('Progress saved!');
        }
      } else {
        // Real API call
        const { offerService } = await import('@/services/api');
        await offerService.upsert(projectId, {
          ...formData,
          isCompleted: markComplete,
        });
        toast.success(markComplete ? 'Offer engineering completed!' : 'Progress saved!');
        if (markComplete) {
          navigate(`/traffic-strategy?projectId=${projectId}`);
        }
      }
    } catch (error) {
      console.error('Offer save error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to save offer';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const addItem = (field, value, setter) => {
    if (!value.trim()) return;
    const current = watch(field) || [];
    if (current.includes(value.trim())) {
      toast.info('This item is already added');
      return;
    }
    setValue(field, [...current, value.trim()]);
    setter('');
  };

  const removeItem = (field, index) => {
    const current = watch(field) || [];
    setValue(field, current.filter((_, i) => i !== index));
  };

  const addSuggestion = (field, suggestion) => {
    const current = watch(field) || [];
    if (current.includes(suggestion)) {
      toast.info('This item is already added');
      return;
    }
    setValue(field, [...current, suggestion]);
  };

  const addBonusSuggestion = (bonus) => {
    const currentBonuses = watch('bonuses') || [];
    const exists = currentBonuses.some(b => b.title === bonus.title);
    if (exists) {
      toast.info('This bonus is already added');
      return;
    }
    appendBonus(bonus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate progress
  const calculateProgress = () => {
    const functionalValues = watch('functionalValues') || [];
    const emotionalValues = watch('emotionalValues') || [];
    const socialValues = watch('socialValues') || [];
    const economicValues = watch('economicValues') || [];
    const experientialValues = watch('experientialValues') || [];

    const fields = [
      functionalValues.length > 0,
      emotionalValues.length > 0,
      socialValues.length > 0,
      economicValues.length > 0,
      experientialValues.length > 0,
      watch('pricing.basePrice') > 0,
    ];
    const filled = fields.filter(f => f).length;
    return Math.round((filled / fields.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Offer Engineering</h1>
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
            <p className="text-sm text-green-600">You can now proceed to Traffic Strategy.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
        {/* Value Propositions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Value Proposition</h2>
            <p className="text-sm text-gray-500">Define the core value you provide to customers</p>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Functional Values - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Functional Values
              </label>
              <p className="text-xs text-gray-500 mb-2">What does your product/service actually do?</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a functional value..."
                  value={newFunctional}
                  onChange={(e) => setNewFunctional(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('functionalValues', newFunctional, setNewFunctional);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem('functionalValues', newFunctional, setNewFunctional)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions:
                </span>
                {VALUE_SUGGESTIONS.functional.filter(s => !(watch('functionalValues') || []).includes(s)).slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSuggestion('functionalValues', suggestion)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 rounded transition-colors"
                  >
                    + {suggestion.substring(0, 25)}...
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(watch('functionalValues') || []).map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-purple-50 text-purple-800 rounded-lg"
                  >
                    <span className="text-sm">{value}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('functionalValues', index)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Emotional Values - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emotional Values
              </label>
              <p className="text-xs text-gray-500 mb-2">How does your customer feel after using it?</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add an emotional value..."
                  value={newEmotional}
                  onChange={(e) => setNewEmotional(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('emotionalValues', newEmotional, setNewEmotional);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem('emotionalValues', newEmotional, setNewEmotional)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions:
                </span>
                {VALUE_SUGGESTIONS.emotional.filter(s => !(watch('emotionalValues') || []).includes(s)).slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSuggestion('emotionalValues', suggestion)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-pink-50 hover:text-pink-700 rounded transition-colors"
                  >
                    + {suggestion.substring(0, 25)}...
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(watch('emotionalValues') || []).map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-pink-50 text-pink-800 rounded-lg"
                  >
                    <span className="text-sm">{value}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('emotionalValues', index)}
                      className="text-pink-600 hover:text-pink-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Values - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Social/Status Values
              </label>
              <p className="text-xs text-gray-500 mb-2">How does it improve their social standing?</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a social value..."
                  value={newSocial}
                  onChange={(e) => setNewSocial(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('socialValues', newSocial, setNewSocial);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem('socialValues', newSocial, setNewSocial)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions:
                </span>
                {VALUE_SUGGESTIONS.social.filter(s => !(watch('socialValues') || []).includes(s)).slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSuggestion('socialValues', suggestion)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors"
                  >
                    + {suggestion.substring(0, 25)}...
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(watch('socialValues') || []).map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 text-blue-800 rounded-lg"
                  >
                    <span className="text-sm">{value}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('socialValues', index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Economic Values - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Economic Values
              </label>
              <p className="text-xs text-gray-500 mb-2">What financial benefits do they receive?</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add an economic value..."
                  value={newEconomic}
                  onChange={(e) => setNewEconomic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('economicValues', newEconomic, setNewEconomic);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem('economicValues', newEconomic, setNewEconomic)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions:
                </span>
                {VALUE_SUGGESTIONS.economic.filter(s => !(watch('economicValues') || []).includes(s)).slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSuggestion('economicValues', suggestion)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded transition-colors"
                  >
                    + {suggestion.substring(0, 25)}...
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(watch('economicValues') || []).map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 text-green-800 rounded-lg"
                  >
                    <span className="text-sm">{value}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('economicValues', index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Experiential Values - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experiential Values
              </label>
              <p className="text-xs text-gray-500 mb-2">What unique experience do they get?</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add an experiential value..."
                  value={newExperiential}
                  onChange={(e) => setNewExperiential(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('experientialValues', newExperiential, setNewExperiential);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem('experientialValues', newExperiential, setNewExperiential)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions:
                </span>
                {VALUE_SUGGESTIONS.experiential.filter(s => !(watch('experientialValues') || []).includes(s)).slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSuggestion('experientialValues', suggestion)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-700 rounded transition-colors"
                  >
                    + {suggestion.substring(0, 25)}...
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(watch('experientialValues') || []).map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-orange-50 text-orange-800 rounded-lg"
                  >
                    <span className="text-sm">{value}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('experientialValues', index)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Bonus Stack */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bonus Stack</h2>
                <p className="text-sm text-gray-500">Add bonuses to increase perceived value</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => appendBonus({ title: '', description: '', value: 0 })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Bonus
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {/* Suggestion chips */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Quick add:
                </span>
                {BONUS_SUGGESTIONS.filter(s => !(watch('bonuses') || []).some(b => b.title === s.title)).slice(0, 6).map((bonus) => (
                  <button
                    key={bonus.title}
                    type="button"
                    onClick={() => addBonusSuggestion(bonus)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-colors"
                  >
                    + {bonus.title}
                  </button>
                ))}
              </div>
            </div>

            {bonusFields.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No bonuses added yet - click suggestions above or add custom bonus</p>
            ) : (
              <div className="space-y-4">
                {bonusFields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Input
                        placeholder="Bonus title"
                        {...register(`bonuses.${index}.title`)}
                        className="flex-1 mr-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBonus(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Bonus description"
                      rows={2}
                      {...register(`bonuses.${index}.description`)}
                      className="mt-2"
                    />
                    <Input
                      type="number"
                      placeholder="Value ($)"
                      {...register(`bonuses.${index}.value`, { valueAsNumber: true })}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Guarantees */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Guarantees</h2>
            <p className="text-sm text-gray-500">Add risk reversal guarantees</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., 30-day money-back guarantee"
                value={newGuarantee}
                onChange={(e) => setNewGuarantee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('guarantees', newGuarantee, setNewGuarantee);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('guarantees', newGuarantee, setNewGuarantee)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3" /> Quick add:
              </span>
              {GUARANTEE_SUGGESTIONS.filter(s => !(watch('guarantees') || []).includes(s)).slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion('guarantees', suggestion)}
                  className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded transition-colors"
                >
                  + {suggestion.substring(0, 25)}...
                </button>
              ))}
            </div>
            {/* Selected items */}
            <div className="space-y-2">
              {(watch('guarantees') || []).map((guarantee, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 text-green-800 rounded-lg"
                >
                  <span>{guarantee}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('guarantees', index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Urgency Tactics */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Urgency Tactics</h2>
            <p className="text-sm text-gray-500">Add scarcity and urgency elements</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., Limited time offer - 48 hours only"
                value={newUrgency}
                onChange={(e) => setNewUrgency(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('urgencyTactics', newUrgency, setNewUrgency);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('urgencyTactics', newUrgency, setNewUrgency)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3" /> Quick add:
              </span>
              {URGENCY_SUGGESTIONS.filter(s => !(watch('urgencyTactics') || []).includes(s)).slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion('urgencyTactics', suggestion)}
                  className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-orange-50 hover:text-orange-700 rounded transition-colors"
                >
                  + {suggestion.substring(0, 25)}...
                </button>
              ))}
            </div>
            {/* Selected items */}
            <div className="space-y-2">
              {(watch('urgencyTactics') || []).map((tactic, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 text-orange-800 rounded-lg"
                >
                  <span>{tactic}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('urgencyTactics', index)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Pricing Strategy */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Pricing Strategy</h2>
            <p className="text-sm text-gray-500">Set your pricing and upsell options</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Base Price"
                type="number"
                placeholder="0.00"
                {...register('pricing.basePrice', { valueAsNumber: true })}
              />
              <Input
                label="Currency"
                placeholder="USD"
                {...register('pricing.currency')}
              />
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Upsell</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Upsell Price"
                  type="number"
                  placeholder="0.00"
                  {...register('pricing.upsell.price', { valueAsNumber: true })}
                />
                <Input
                  label="Upsell Description"
                  placeholder="Premium version with additional features"
                  {...register('pricing.upsell.description')}
                />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Cross-sell</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Cross-sell Price"
                  type="number"
                  placeholder="0.00"
                  {...register('pricing.crossSell.price', { valueAsNumber: true })}
                />
                <Input
                  label="Cross-sell Description"
                  placeholder="Complementary product"
                  {...register('pricing.crossSell.description')}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {!isCompleted ? (
            <>
              <Button type="submit" variant="secondary" loading={saving}>
                Save Progress
              </Button>
              <Button type="button" loading={saving} onClick={handleSubmit((data) => onSubmit(data, true))}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete & Continue
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => navigate(`/traffic-strategy?projectId=${projectId}`)}>
              Continue to Traffic Strategy
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}