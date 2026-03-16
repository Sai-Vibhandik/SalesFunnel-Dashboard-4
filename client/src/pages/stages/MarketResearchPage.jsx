import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, Plus, X, Upload, CheckCircle, Lightbulb } from 'lucide-react';

// STATIC DATA MODE - Set to true for development, false for API calls
const USE_STATIC_DATA = false;

// Predefined suggestions for quick selection
const SUGGESTIONS = {
  painPoints: [
    'Low conversion rates',
    'High customer acquisition cost',
    'Poor lead quality',
    'Inconsistent sales',
    'Low website traffic',
    'High cart abandonment',
    'Poor customer retention',
    'Ineffective marketing',
    'Limited budget',
    'Time constraints',
    'Lack of automation',
    'Poor brand awareness',
    'Competition undercutting prices',
    'Difficulty scaling',
    'Low email open rates',
  ],
  desires: [
    'Increase sales',
    'Better ROI',
    'Automated marketing',
    'Higher conversion rates',
    'Quality leads',
    'Brand recognition',
    'Customer loyalty',
    'Scalable systems',
    'Cost reduction',
    'Time efficiency',
    'Data-driven decisions',
    'Competitive advantage',
    'Recurring revenue',
    'Market expansion',
    'Better customer insights',
  ],
  existingPurchases: [
    'CRM software',
    'Email marketing tool',
    'Analytics platform',
    'Social media management',
    'Advertising platform',
    'Website hosting',
    'SEO tools',
    'Course/Training',
    'Consulting services',
    'Marketing automation',
    'Landing page builder',
    'Chat software',
    'Phone system',
    'Accounting software',
  ],
  interests: [
    'Digital Marketing',
    'Business Growth',
    'Lead Generation',
    'Sales Automation',
    'Content Marketing',
    'Social Media',
    'Email Marketing',
    'SEO',
    'Paid Advertising',
    'Analytics',
    'Customer Experience',
    'Brand Building',
    'E-commerce',
    'Funnel Optimization',
    'Copywriting',
  ],
  ageRanges: [
    '18-24 years',
    '25-34 years',
    '35-44 years',
    '45-54 years',
    '55-64 years',
    '65+ years',
  ],
  incomeLevels: [
    'Under $25,000/year',
    '$25,000 - $50,000/year',
    '$50,000 - $75,000/year',
    '$75,000 - $100,000/year',
    '$100,000 - $150,000/year',
    '$150,000 - $250,000/year',
    '$250,000+/year',
  ],
  professions: [
    'Marketing Manager',
    'Business Owner',
    'Entrepreneur',
    'CEO/Founder',
    'Sales Director',
    'Digital Marketer',
    'E-commerce Manager',
    'Marketing Consultant',
    'Agency Owner',
    'Product Manager',
  ],
};

// Mock project data
const STATIC_PROJECT = {
  _id: 'static-project-1',
  customerName: 'John Smith',
  businessName: 'Acme Corporation',
  email: 'john@acme.com',
  mobile: '+1-555-0123',
  currentStage: 2,
  overallProgress: 16,
  stages: {
    onboarding: { isCompleted: true, completedAt: new Date() },
    marketResearch: { isCompleted: false, completedAt: null },
    offerEngineering: { isCompleted: false, completedAt: null },
    trafficStrategy: { isCompleted: false, completedAt: null },
    landingPage: { isCompleted: false, completedAt: null },
    creativeStrategy: { isCompleted: false, completedAt: null }
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock market research data
const STATIC_MARKET_RESEARCH = {
  avatar: {
    ageRanges: ['25-34 years'],
    location: 'United States, Urban areas',
    incomeLevels: ['$50,000 - $75,000/year'],
    professions: ['Marketing Manager', 'Business Owner'],
    interests: ['Digital Marketing', 'Business Growth', 'Lead Generation']
  },
  painPoints: ['Low conversion rates', 'High customer acquisition cost', 'Poor lead quality'],
  desires: ['Increase sales', 'Better ROI', 'Automated marketing'],
  existingPurchases: ['CRM software', 'Email marketing tool', 'Analytics platform'],
  competitors: 'Competitor A has strong brand recognition but high prices. Competitor B offers budget solutions but lacks features.',
  completionPercentage: 50,
  isCompleted: false
};

// Reusable MultiSelectField component for array fields with suggestions
function MultiSelectField({ label, fieldName, suggestions, watch, setValue, newItem, setNewItem, placeholder }) {
  const selectedItems = watch(fieldName) || [];
  const availableSuggestions = suggestions.filter(s => !selectedItems.includes(s));

  const addItem = () => {
    if (!newItem.trim()) return;
    if (selectedItems.includes(newItem.trim())) {
      toast.info('This item is already added');
      return;
    }
    setValue(fieldName, [...selectedItems, newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (index) => {
    const current = [...selectedItems];
    current.splice(index, 1);
    setValue(fieldName, current);
  };

  const addSuggestion = (suggestion) => {
    if (selectedItems.includes(suggestion)) {
      toast.info('This item is already added');
      return;
    }
    setValue(fieldName, [...selectedItems, suggestion]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          placeholder={placeholder}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" onClick={addItem}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
            <Lightbulb className="w-3 h-3" /> Suggestions:
          </span>
          {availableSuggestions.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSuggestion(suggestion)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full transition-colors"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="hover:text-primary-900"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarketResearchPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newDesire, setNewDesire] = useState('');
  const [newPurchase, setNewPurchase] = useState('');
  const [newAgeRange, setNewAgeRange] = useState('');
  const [newIncomeLevel, setNewIncomeLevel] = useState('');
  const [newProfession, setNewProfession] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      avatar: {
        ageRanges: [],
        location: '',
        incomeLevels: [],
        professions: [],
        interests: [],
      },
      painPoints: [],
      desires: [],
      existingPurchases: [],
      competitorsText: '',
    },
  });

  // Watch values for display
  const interests = watch('avatar.interests') || [];
  const ageRanges = watch('avatar.ageRanges') || [];
  const incomeLevels = watch('avatar.incomeLevels') || [];
  const professions = watch('avatar.professions') || [];
  const painPoints = watch('painPoints') || [];
  const desires = watch('desires') || [];
  const existingPurchases = watch('existingPurchases') || [];

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
        setProject(STATIC_PROJECT);
        setValue('avatar', {
          ...STATIC_MARKET_RESEARCH.avatar,
          ageRanges: STATIC_MARKET_RESEARCH.avatar.ageRanges || [],
          incomeLevels: STATIC_MARKET_RESEARCH.avatar.incomeLevels || [],
          professions: STATIC_MARKET_RESEARCH.avatar.professions || [],
        });
        setValue('painPoints', STATIC_MARKET_RESEARCH.painPoints);
        setValue('desires', STATIC_MARKET_RESEARCH.desires);
        setValue('existingPurchases', STATIC_MARKET_RESEARCH.existingPurchases);
        setValue('competitors', STATIC_MARKET_RESEARCH.competitors[0]?.name || '');
        setIsCompleted(STATIC_MARKET_RESEARCH.isCompleted);
      } else {
        const { projectService, marketResearchService } = await import('@/services/api');
        const [projectRes, dataRes] = await Promise.all([
          projectService.getProject(projectId),
          marketResearchService.get(projectId),
        ]);
        setProject(projectRes.data);

        if (dataRes.data) {
          const avatar = dataRes.data.avatar || {};
          setValue('avatar', {
            ageRanges: avatar.ageRanges || [],
            location: avatar.location || '',
            incomeLevels: avatar.incomeLevels || [],
            professions: avatar.professions || [],
            interests: avatar.interests || [],
          });
          setValue('painPoints', dataRes.data.painPoints || []);
          setValue('desires', dataRes.data.desires || []);
          setValue('existingPurchases', dataRes.data.existingPurchases || []);
          setValue('competitorsText', dataRes.data.competitors || '');
          setIsCompleted(dataRes.data.isCompleted);
        }
      }
    } catch (error) {
      // Only show error for actual failures (network errors, 500 errors, 403, 404)
      // The API interceptor transforms errors, so error.message is available directly
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load market research';
      const statusCode = error?.response?.status || error?.status;

      console.error('Market research fetch error:', error);

      if (statusCode === 403) {
        toast.error('You do not have access to this project');
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
        await new Promise(resolve => setTimeout(resolve, 500));
        if (markComplete) {
          setIsCompleted(true);
          setProject(prev => ({
            ...prev,
            stages: {
              ...prev.stages,
              marketResearch: { isCompleted: true, completedAt: new Date() }
            },
            currentStage: 3,
            overallProgress: 33
          }));
          toast.success('Market research completed! Moving to Offer Engineering...');
          setTimeout(() => {
            navigate(`/offer-engineering?projectId=${projectId}`);
          }, 1500);
        } else {
          toast.success('Progress saved!');
        }
      } else {
        const { marketResearchService } = await import('@/services/api');
        // Transform competitorsText to competitors for backend
        const submitData = {
          ...formData,
          competitors: formData.competitorsText || '',
        };
        delete submitData.competitorsText;
        await marketResearchService.upsert(projectId, {
          ...submitData,
          isCompleted: markComplete,
        });
        toast.success(markComplete ? 'Market research completed!' : 'Progress saved!');
        if (markComplete) {
          navigate(`/offer-engineering?projectId=${projectId}`);
        } else {
          fetchData();
        }
      }
    } catch (error) {
      console.error('Market research save error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to save market research';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const calculateProgress = () => {
    const fields = [
      ageRanges.length > 0,
      watch('avatar.location'),
      incomeLevels.length > 0,
      professions.length > 0,
      painPoints.length > 0,
      desires.length > 0,
      existingPurchases.length > 0,
      watch('competitorsText'),
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
          <h1 className="text-2xl font-bold text-gray-900">Market Research</h1>
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
            <p className="text-sm text-green-600">You can now proceed to Offer Engineering.</p>
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
        {/* Customer Avatar */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Customer Avatar</h2>
            <p className="text-sm text-gray-500">Define your ideal customer profile</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location"
                placeholder="e.g., United States, Urban areas"
                error={errors.avatar?.location?.message}
                {...register('avatar.location')}
              />
            </div>

            {/* Age Ranges - Multi-select */}
            <MultiSelectField
              label="Age Ranges"
              fieldName="avatar.ageRanges"
              suggestions={SUGGESTIONS.ageRanges}
              watch={watch}
              setValue={setValue}
              newItem={newAgeRange}
              setNewItem={setNewAgeRange}
              placeholder="Add age range..."
            />

            {/* Income Levels - Multi-select */}
            <MultiSelectField
              label="Income Levels"
              fieldName="avatar.incomeLevels"
              suggestions={SUGGESTIONS.incomeLevels}
              watch={watch}
              setValue={setValue}
              newItem={newIncomeLevel}
              setNewItem={setNewIncomeLevel}
              placeholder="Add income level..."
            />

            {/* Professions - Multi-select */}
            <MultiSelectField
              label="Professions"
              fieldName="avatar.professions"
              suggestions={SUGGESTIONS.professions}
              watch={watch}
              setValue={setValue}
              newItem={newProfession}
              setNewItem={setNewProfession}
              placeholder="Add profession..."
            />

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add an interest..."
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('avatar.interests', newInterest, setNewInterest);
                    }
                  }}
                />
                <Button type="button" onClick={() => addItem('avatar.interests', newInterest, setNewInterest)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                  <Lightbulb className="w-3 h-3" /> Suggestions:
                </span>
                {SUGGESTIONS.interests.filter(s => !interests.includes(s)).slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addSuggestion('avatar.interests', suggestion)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeItem('avatar.interests', index)}
                      className="hover:text-primary-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pain Points */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Customer Pain Points</h2>
            <p className="text-sm text-gray-500">What problems does your customer face?</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a pain point..."
                value={newPainPoint}
                onChange={(e) => setNewPainPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('painPoints', newPainPoint, setNewPainPoint);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('painPoints', newPainPoint, setNewPainPoint)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3" /> Quick add:
              </span>
              {SUGGESTIONS.painPoints.filter(s => !painPoints.includes(s)).slice(0, 10).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion('painPoints', suggestion)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-700 rounded-full transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {painPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 text-red-800 rounded-lg"
                >
                  <span>{point}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('painPoints', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Desires */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Customer Desires</h2>
            <p className="text-sm text-gray-500">What does your customer want to achieve?</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a desire..."
                value={newDesire}
                onChange={(e) => setNewDesire(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('desires', newDesire, setNewDesire);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('desires', newDesire, setNewDesire)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3" /> Quick add:
              </span>
              {SUGGESTIONS.desires.filter(s => !desires.includes(s)).slice(0, 10).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion('desires', suggestion)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-full transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {desires.map((desire, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 text-green-800 rounded-lg"
                >
                  <span>{desire}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('desires', index)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Existing Purchases */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Existing Purchases</h2>
            <p className="text-sm text-gray-500">What has your customer already purchased?</p>
          </CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a purchase..."
                value={newPurchase}
                onChange={(e) => setNewPurchase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('existingPurchases', newPurchase, setNewPurchase);
                  }
                }}
              />
              <Button type="button" onClick={() => addItem('existingPurchases', newPurchase, setNewPurchase)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1 mr-1">
                <Lightbulb className="w-3 h-3" /> Quick add:
              </span>
              {SUGGESTIONS.existingPurchases.filter(s => !existingPurchases.includes(s)).slice(0, 10).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSuggestion('existingPurchases', suggestion)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {existingPurchases.map((purchase, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 text-blue-800 rounded-lg"
                >
                  <span>{purchase}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('existingPurchases', index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Competitor Analysis */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Competitor Funnels</h2>
            <p className="text-sm text-gray-500">Analyze your competition</p>
          </CardHeader>
          <CardBody>
            <Textarea
              placeholder="Describe your competitors and their strategies..."
              rows={4}
              {...register('competitorsText')}
            />
          </CardBody>
        </Card>

        {/* File Uploads */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500">Upload vision board and strategy sheets</p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vision Board</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">10-Year Strategy Sheet</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </div>
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
            <Button type="button" onClick={() => navigate(`/offer-engineering?projectId=${projectId}`)}>
              Continue to Offer Engineering
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}