import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Spinner } from '@/components/ui';
import { Plus, Edit, Trash2, FileText, X, ArrowRight, Users, Code, Palette } from 'lucide-react';
import { projectService, authService } from '@/services/api';

const FUNNEL_TYPES = [
  { id: 'video_sales_letter', label: 'Video Sales Letter' },
  { id: 'long_form', label: 'Long Form Page' },
  { id: 'lead_magnet', label: 'Lead Magnet' },
  { id: 'ebook', label: 'E-book Page' },
  { id: 'webinar', label: 'Webinar Page' }
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
  { id: 'multi', label: 'Multi-Platform' }
];

const LEAD_CAPTURE_METHODS = [
  { id: 'form', label: 'Form' },
  { id: 'calendly', label: 'Calendly' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'free_audit', label: 'Free Audit' }
];

export default function LandingPagesSection({ projectId, landingPages = [], onSave, loading, isCompleted, assignedTeam }) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    funnelType: 'video_sales_letter',
    platform: 'facebook',
    hook: '',
    angle: '',
    cta: '',
    offer: '',
    messaging: '',
    leadCaptureMethod: 'form',
    headline: '',
    subheadline: '',
    assignedDesigner: '',
    assignedDeveloper: ''
  });

  // Fetch available designers and developers from project's assigned team
  useEffect(() => {
    if (assignedTeam) {
      // Get UI/UX Designers from project's assigned team
      const uiUxDesigners = assignedTeam.uiUxDesigners || [];
      const uiUxDesignerLegacy = assignedTeam.uiUxDesigner;
      const allDesigners = uiUxDesigners.length > 0 ? uiUxDesigners : (uiUxDesignerLegacy ? [uiUxDesignerLegacy] : []);
      setDesigners(allDesigners);

      // Get Developers from project's assigned team
      const developersList = assignedTeam.developers || [];
      const developerLegacy = assignedTeam.developer;
      const allDevelopers = developersList.length > 0 ? developersList : (developerLegacy ? [developerLegacy] : []);
      setDevelopers(allDevelopers);
    }
  }, [assignedTeam]);

  const resetForm = () => {
    setFormData({
      name: '',
      funnelType: 'video_sales_letter',
      platform: 'facebook',
      hook: '',
      angle: '',
      cta: '',
      offer: '',
      messaging: '',
      leadCaptureMethod: 'form',
      headline: '',
      subheadline: '',
      assignedDesigner: designers.length === 1 ? (designers[0]._id || designers[0])?.toString() : '',
      assignedDeveloper: developers.length === 1 ? (developers[0]._id || developers[0])?.toString() : ''
    });
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (index) => {
    const lp = landingPages[index];
    setFormData({
      name: lp.name || '',
      funnelType: lp.funnelType || 'video_sales_letter',
      platform: lp.platform || 'facebook',
      hook: lp.hook || '',
      angle: lp.angle || '',
      cta: lp.cta || '',
      offer: lp.offer || '',
      messaging: lp.messaging || '',
      leadCaptureMethod: lp.leadCaptureMethod || 'form',
      headline: lp.headline || '',
      subheadline: lp.subheadline || '',
      assignedDesigner: lp.assignedDesigner?._id || lp.assignedDesigner?.toString() || '',
      assignedDeveloper: lp.assignedDeveloper?._id || lp.assignedDeveloper?.toString() || ''
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a landing page name');
      return;
    }

    if (!formData.assignedDesigner) {
      toast.error('Please select a UI/UX Designer for this landing page');
      return;
    }

    if (!formData.assignedDeveloper) {
      toast.error('Please select a Developer for this landing page');
      return;
    }

    setSaving(true);
    try {
      if (editingIndex !== null) {
        // Update existing
        await onSave('update', editingIndex, formData);
        toast.success('Landing page updated');
      } else {
        // Add new
        await onSave('add', null, formData);
        toast.success('Landing page added');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving landing page:', error);
      toast.error(error?.message || 'Failed to save landing page');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index) => {
    if (!confirm('Are you sure you want to delete this landing page?')) {
      return;
    }

    setSaving(true);
    try {
      await onSave('delete', index);
      toast.success('Landing page deleted');
    } catch (error) {
      console.error('Error deleting landing page:', error);
      toast.error(error?.message || 'Failed to delete landing page');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (landingPages.length === 0) {
      toast.error('Please add at least one landing page before continuing');
      return;
    }

    // Check if all landing pages have team assignments
    const unassignedLPs = landingPages.filter(lp => !lp.assignedDesigner || !lp.assignedDeveloper);
    if (unassignedLPs.length > 0) {
      toast.error(`${unassignedLPs.length} landing page(s) missing team assignments. Please edit and assign designer/developer.`);
      return;
    }

    try {
      setSaving(true);
      // Mark landing page stage as complete
      await projectService.completeLandingPageStage(projectId);
      toast.success('Landing page stage completed!');
      navigate(`/creative-strategy?projectId=${projectId}`);
    } catch (error) {
      console.error('Error completing stage:', error);
      // Even if completion fails, try to navigate if there are landing pages
      navigate(`/creative-strategy?projectId=${projectId}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper to get member name
  const getMemberName = (member) => {
    if (!member) return 'Unknown';
    if (typeof member === 'object') return member.name || 'Unknown';
    return 'Unknown';
  };

  // Helper to get designer name by ID
  const getDesignerName = (id) => {
    if (!id) return 'Not assigned';
    const designer = designers.find(d => (d._id || d)?.toString() === id.toString());
    return designer ? getMemberName(designer) : 'Unknown';
  };

  // Helper to get developer name by ID
  const getDeveloperName = (id) => {
    if (!id) return 'Not assigned';
    const developer = developers.find(d => (d._id || d)?.toString() === id.toString());
    return developer ? getMemberName(developer) : 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Landing Pages</h2>
            <p className="text-sm text-gray-500">Create landing page strategies and assign team members for each</p>
          </div>
          {!showForm && (
            <Button onClick={handleAddNew} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Landing Page
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Landing Page Form */}
        {showForm && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {editingIndex !== null ? 'Edit Landing Page' : 'New Landing Page'}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Landing Page Name"
                placeholder="e.g., Free Trial Funnel"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funnel Type</label>
                <select
                  value={formData.funnelType}
                  onChange={(e) => handleInputChange('funnelType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {FUNNEL_TYPES.map(ft => (
                    <option key={ft.id} value={ft.id}>{ft.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => handleInputChange('platform', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Capture Method</label>
                <select
                  value={formData.leadCaptureMethod}
                  onChange={(e) => handleInputChange('leadCaptureMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {LEAD_CAPTURE_METHODS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Team Member Assignments */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Assignments for this Landing Page
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Palette className="w-4 h-4 text-purple-500" />
                    UI/UX Designer *
                  </label>
                  <select
                    value={formData.assignedDesigner}
                    onChange={(e) => handleInputChange('assignedDesigner', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Designer...</option>
                    {designers.map(d => (
                      <option key={d._id || d} value={(d._id || d).toString()}>
                        {getMemberName(d)}
                      </option>
                    ))}
                  </select>
                  {designers.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No UI/UX Designers assigned to this project. Contact Admin.
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Code className="w-4 h-4 text-green-500" />
                    Developer *
                  </label>
                  <select
                    value={formData.assignedDeveloper}
                    onChange={(e) => handleInputChange('assignedDeveloper', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Developer...</option>
                    {developers.map(d => (
                      <option key={d._id || d} value={(d._id || d).toString()}>
                        {getMemberName(d)}
                      </option>
                    ))}
                  </select>
                  {developers.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No Developers assigned to this project. Contact Admin.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Input
              label="Hook"
              placeholder="What's the main hook that grabs attention?"
              value={formData.hook}
              onChange={(e) => handleInputChange('hook', e.target.value)}
            />

            <Input
              label="Angle"
              placeholder="What's the creative angle or approach?"
              value={formData.angle}
              onChange={(e) => handleInputChange('angle', e.target.value)}
            />

            <Input
              label="Call-to-Action (CTA)"
              placeholder="e.g., Get Started Now"
              value={formData.cta}
              onChange={(e) => handleInputChange('cta', e.target.value)}
            />

            <Input
              label="Offer"
              placeholder="What's the main offer?"
              value={formData.offer}
              onChange={(e) => handleInputChange('offer', e.target.value)}
            />

            <Input
              label="Headline"
              placeholder="Main headline for the landing page"
              value={formData.headline}
              onChange={(e) => handleInputChange('headline', e.target.value)}
            />

            <Input
              label="Subheadline"
              placeholder="Supporting headline"
              value={formData.subheadline}
              onChange={(e) => handleInputChange('subheadline', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Messaging</label>
              <textarea
                value={formData.messaging}
                onChange={(e) => handleInputChange('messaging', e.target.value)}
                placeholder="Key messaging and talking points"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {editingIndex !== null ? 'Update' : 'Add'} Landing Page
              </Button>
            </div>
          </div>
        )}

        {/* Landing Pages List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : landingPages.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No landing pages created yet</p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Landing Page
            </Button>
          </div>
        ) : (
          !showForm && (
            <div className="space-y-3">
              {landingPages.map((lp, index) => (
                <div
                  key={lp._id || index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{lp.name}</h4>
                    <p className="text-sm text-gray-500">
                      {FUNNEL_TYPES.find(ft => ft.id === lp.funnelType)?.label || lp.funnelType} • {PLATFORMS.find(p => p.id === lp.platform)?.label || lp.platform}
                    </p>
                    {lp.hook && (
                      <p className="text-sm text-gray-400 mt-1 truncate max-w-md">
                        Hook: {lp.hook}
                      </p>
                    )}
                    {/* Show assigned team members */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs flex items-center gap-1 text-purple-600">
                        <Palette className="w-3 h-3" />
                        {getDesignerName(lp.assignedDesigner)}
                      </span>
                      <span className="text-xs flex items-center gap-1 text-green-600">
                        <Code className="w-3 h-3" />
                        {getDeveloperName(lp.assignedDeveloper)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(index)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Continue Button */}
        {!showForm && landingPages.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleContinue} loading={saving}>
              Continue to Next Stage
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}