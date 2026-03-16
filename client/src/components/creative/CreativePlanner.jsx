import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Textarea, Badge } from '@/components/ui';
import {
  Image, Video, Layout, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, FileImage,
  Target, Type, Monitor, Users, FileText, Megaphone, TrendingUp, Zap, Eye, MousePointer,
  UserPlus, Send, DollarSign
} from 'lucide-react';
import {
  CREATIVE_TYPES,
  CREATIVE_SUBTYPES,
  CAMPAIGN_OBJECTIVES,
  CREATIVE_ROLES,
  getSubTypesForCreativeType,
  getRoleLabel
} from '@/constants/creativeTypes';

// Icon mapping for creative types
const CREATIVE_TYPE_ICONS = {
  IMAGE: Image,
  VIDEO: Video,
  CAROUSEL: Layout
};

// Icon mapping for ad types (objectives)
const OBJECTIVE_ICONS = {
  awareness: Eye,
  nurturing: TrendingUp,
  traffic: MousePointer,
  retargeting: Target,
  engagement: Zap,
  lead_generation: UserPlus,
  conversion: Send,
  app_install: Monitor,
  sales: DollarSign,
  brand_consideration: Megaphone
};

// Objective colors
const OBJECTIVE_COLORS = {
  awareness: 'bg-blue-100 text-blue-700 border-blue-200',
  nurturing: 'bg-green-100 text-green-700 border-green-200',
  traffic: 'bg-purple-100 text-purple-700 border-purple-200',
  retargeting: 'bg-orange-100 text-orange-700 border-orange-200',
  engagement: 'bg-pink-100 text-pink-700 border-pink-200',
  lead_generation: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  conversion: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  app_install: 'bg-violet-100 text-violet-700 border-violet-200',
  sales: 'bg-amber-100 text-amber-700 border-amber-200',
  brand_consideration: 'bg-indigo-100 text-indigo-700 border-indigo-200'
};

// Screen sizes (flat list without platform dependency)
const FLAT_SCREEN_SIZES = [
  { key: 'square', label: 'Square (1:1)', dimensions: '1080x1080' },
  { key: 'portrait', label: 'Portrait (4:5)', dimensions: '1080x1350' },
  { key: 'three_four', label: '3:4', dimensions: '1080x1440' },
  { key: 'story', label: 'Story (9:16)', dimensions: '1080x1920' },
  { key: 'reel', label: 'Reel (9:16)', dimensions: '1080x1920' },
  { key: 'shorts', label: 'Shorts (9:16)', dimensions: '1080x1920' },
  { key: 'video', label: 'Video (16:9)', dimensions: '1920x1080' },
  { key: 'thumbnail', label: 'Thumbnail', dimensions: '1280x720' }
];

// Generate unique ID for creative rows
const generateId = () => `creative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default creative row
const createEmptyCreative = () => ({
  _id: generateId(),
  name: '',
  adType: '',
  creativeType: 'IMAGE',
  subType: '',
  screenSizes: [],
  assignedRole: '',
  assignedTeamMembers: [],
  notes: ''
});

// Map role keys to project assignedTeam fields
const ROLE_TO_TEAM_FIELD = {
  'content_writer': { arrayField: 'contentWriters', legacyField: 'contentWriter' },
  'graphic_designer': { arrayField: 'graphicDesigners', legacyField: 'graphicDesigner' },
  'video_editor': { arrayField: 'videoEditors', legacyField: 'videoEditor' }
};

export default function CreativePlanner({
  projectId,
  initialData,
  onSave,
  isCompleted,
  project
}) {
  const [saving, setSaving] = useState(false);
  const [projectAssignedTeam, setProjectAssignedTeam] = useState({});
  const [creativePlan, setCreativePlan] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [expandedCards, setExpandedCards] = useState({});

  // Extract project assigned team from project prop - this is the ONLY source of team members
  useEffect(() => {
    console.log('=== CreativePlanner: Extracting project-assigned team ===');
    console.log('Project prop:', project);

    if (project?.assignedTeam) {
      console.log('assignedTeam found with keys:', Object.keys(project.assignedTeam));
      console.log('contentWriters:', project.assignedTeam.contentWriters);
      console.log('graphicDesigners:', project.assignedTeam.graphicDesigners);
      console.log('videoEditors:', project.assignedTeam.videoEditors);

      setProjectAssignedTeam(project.assignedTeam);
    } else {
      console.log('No assignedTeam in project');
      setProjectAssignedTeam({});
    }
  }, [project]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.creativePlan && initialData.creativePlan.length > 0) {
        const migratedPlan = initialData.creativePlan.map(item => ({
          _id: item._id || generateId(),
          name: item.name || '',
          adType: item.objective || item.adType || '',
          creativeType: item.creativeType || 'IMAGE',
          subType: item.subType || item.adType || '',
          screenSizes: item.screenSizes || [],
          assignedRole: item.assignedRole || '',
          assignedTeamMembers: item.assignedTeamMembers || [],
          notes: item.notes || ''
        }));
        setCreativePlan(migratedPlan);
        // Expand all cards initially
        const expanded = {};
        migratedPlan.forEach(item => {
          expanded[item._id] = true;
        });
        setExpandedCards(expanded);
      }

      if (initialData.additionalNotes) {
        setAdditionalNotes(initialData.additionalNotes);
      }
    }
  }, [initialData]);

  // Toggle card expansion
  const toggleCard = (rowId) => {
    setExpandedCards(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  // Add new creative row
  const addCreativeRow = () => {
    const newId = generateId();
    setCreativePlan(prev => [...prev, { ...createEmptyCreative(), _id: newId }]);
    setExpandedCards(prev => ({ ...prev, [newId]: true }));
  };

  // Remove creative row
  const removeCreativeRow = (rowId) => {
    setCreativePlan(prev => prev.filter(row => row._id !== rowId));
    setExpandedCards(prev => {
      const newExpanded = { ...prev };
      delete newExpanded[rowId];
      return newExpanded;
    });
  };

  // Update creative row field
  const updateCreativeRow = (rowId, field, value) => {
    setCreativePlan(prev =>
      prev.map(row => {
        if (row._id !== rowId) return row;

        const updatedRow = { ...row, [field]: value };

        // Reset sub-type when creative type changes
        if (field === 'creativeType') {
          updatedRow.subType = '';
        }

        // When role changes, AUTO-ASSIGN the project-assigned team members
        // Performance Marketer cannot manually select - only Admin-assigned members are used
        if (field === 'assignedRole') {
          // Get the project-assigned members for this role
          const fieldConfig = ROLE_TO_TEAM_FIELD[value];
          if (fieldConfig && projectAssignedTeam) {
            const assignedMembers = [];

            // Check new array field first
            const arrayField = projectAssignedTeam[fieldConfig.arrayField];
            if (arrayField && Array.isArray(arrayField) && arrayField.length > 0) {
              arrayField.forEach(member => {
                if (member && (member._id || member.name)) {
                  assignedMembers.push(member._id?.toString?.() || member._id || member);
                }
              });
            }

            // Fall back to legacy field
            if (assignedMembers.length === 0) {
              const legacyField = projectAssignedTeam[fieldConfig.legacyField];
              if (legacyField) {
                assignedMembers.push(legacyField._id?.toString?.() || legacyField._id || legacyField);
              }
            }

            updatedRow.assignedTeamMembers = assignedMembers;
            console.log(`Auto-assigned ${assignedMembers.length} members for role "${value}"`);
          } else {
            updatedRow.assignedTeamMembers = [];
          }
        }

        return updatedRow;
      })
    );
  };

  // Handle screen size toggle
  const toggleScreenSize = (rowId, sizeKey) => {
    setCreativePlan(prev =>
      prev.map(row => {
        if (row._id !== rowId) return row;

        const currentSizes = row.screenSizes || [];
        const newSizes = currentSizes.includes(sizeKey)
          ? currentSizes.filter(s => s !== sizeKey)
          : [...currentSizes, sizeKey];

        return { ...row, screenSizes: newSizes };
      })
    );
  };

  // Get ONLY the project-assigned team members for a role (set by Admin during project creation)
  // Performance Marketer should NOT be able to change these assignments
  const getProjectAssignedMembers = (role) => {
    console.log('=== getProjectAssignedMembers called ===');
    console.log('Role requested:', role);

    if (!role) {
      console.log('No role provided, returning empty array');
      return [];
    }

    const fieldConfig = ROLE_TO_TEAM_FIELD[role];
    console.log('fieldConfig for role:', fieldConfig);

    if (!fieldConfig) {
      console.log('No fieldConfig found for role:', role);
      return [];
    }

    if (!projectAssignedTeam || Object.keys(projectAssignedTeam).length === 0) {
      console.log('No projectAssignedTeam data available');
      return [];
    }

    const assignedMembers = [];

    // Check new array field first (preferred)
    const arrayField = projectAssignedTeam[fieldConfig.arrayField];
    console.log(`Array field "${fieldConfig.arrayField}":`, arrayField);

    if (arrayField && Array.isArray(arrayField) && arrayField.length > 0) {
      arrayField.forEach(member => {
        if (member && (member._id || member.name)) {
          assignedMembers.push({
            _id: member._id?.toString?.() || member._id || member,
            name: member.name || 'Unknown',
            isProjectAssigned: true
          });
        }
      });
      console.log(`Found ${assignedMembers.length} members from array field`);
    }

    // Fall back to legacy field if no array field data
    if (assignedMembers.length === 0) {
      const legacyField = projectAssignedTeam[fieldConfig.legacyField];
      console.log(`Checking legacy field "${fieldConfig.legacyField}":`, legacyField);

      if (legacyField) {
        assignedMembers.push({
          _id: legacyField._id?.toString?.() || legacyField._id || legacyField,
          name: legacyField.name || 'Unknown',
          isProjectAssigned: true
        });
        console.log('Found 1 member from legacy field');
      }
    }

    console.log(`Returning ${assignedMembers.length} project-assigned members for role "${role}"`);
    return assignedMembers;
  };

  // Calculate totals
  const totalCreatives = creativePlan.length;
  const imageCount = creativePlan.filter(c => c.creativeType === 'IMAGE').length;
  const videoCount = creativePlan.filter(c => c.creativeType === 'VIDEO').length;
  const carouselCount = creativePlan.filter(c => c.creativeType === 'CAROUSEL').length;

  // Handle save
  const handleSave = async (markComplete = false) => {
    try {
      setSaving(true);

      const validCreatives = creativePlan.filter(row =>
        row.adType &&
        row.creativeType &&
        row.subType &&
        row.screenSizes.length > 0 &&
        row.assignedRole &&
        row.assignedTeamMembers.length > 0
      );

      if (markComplete && validCreatives.length === 0) {
        toast.error('Please add at least one creative with all fields filled');
        setSaving(false);
        return;
      }

      const data = {
        creativePlan: creativePlan.map((row, index) => ({
          creativeType: row.creativeType,
          subType: row.subType,
          objective: row.adType,
          screenSizes: row.screenSizes || [],
          assignedRole: row.assignedRole || '',
          assignedTeamMembers: row.assignedTeamMembers || [],
          notes: row.notes || '',
          name: row.name || `Creative ${index + 1}`,
          order: index,
          _id: row._id && !row._id.toString().startsWith('creative_') ? row._id : undefined
        })),
        additionalNotes,
        isCompleted: markComplete
      };

      await onSave(data, markComplete);
      toast.success(markComplete ? 'Creative strategy completed!' : 'Progress saved!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-semibold text-sm">
          2
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Creative Strategy</h2>
          <p className="text-sm text-gray-500">Define your creatives - team members are auto-assigned based on project setup</p>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-800">Creative Strategy Completed!</h3>
            <p className="text-sm text-green-600">All creative plan details have been saved.</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {creativePlan.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-primary-600">{totalCreatives}</div>
            <div className="text-sm text-gray-500">Total Creatives</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{imageCount}</span>
            </div>
            <div className="text-sm text-gray-500">Image</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">{videoCount}</span>
            </div>
            <div className="text-sm text-gray-500">Video</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-600">{carouselCount}</span>
            </div>
            <div className="text-sm text-gray-500">Carousel</div>
          </div>
        </div>
      )}

      {/* Creative Cards */}
      <div className="space-y-4">
        {creativePlan.map((row, index) => {
          const subTypes = getSubTypesForCreativeType(row.creativeType);
          // Get ONLY project-assigned members (set by Admin during project creation)
          const assignedMembers = getProjectAssignedMembers(row.assignedRole);
          const isExpanded = expandedCards[row._id];

          return (
            <Card key={row._id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              {/* Card Header - Always Visible */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleCard(row._id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 text-primary-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {row.name || `Creative ${index + 1}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {row.adType && (
                        <Badge className={`${OBJECTIVE_COLORS[row.adType] || 'bg-gray-100 text-gray-700'} text-xs`}>
                          {CAMPAIGN_OBJECTIVES.find(o => o.key === row.adType)?.label || row.adType}
                        </Badge>
                      )}
                      {row.creativeType && (
                        <Badge variant="secondary" className="text-xs">
                          {CREATIVE_TYPES.find(t => t.key === row.creativeType)?.label || row.creativeType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCreativeRow(row._id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Card Body - Collapsible */}
              {isExpanded && (
                <CardBody className="p-4 space-y-4">
                  {/* Row 1: Creative Name & Ad Type */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Creative Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        Creative Name
                      </label>
                      <input
                        type="text"
                        value={row.name || ''}
                        onChange={(e) => updateCreativeRow(row._id, 'name', e.target.value)}
                        placeholder={`Creative ${index + 1}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Ad Type (Objective) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Target className="w-4 h-4 text-gray-400" />
                        Ad Type
                      </label>
                      <select
                        value={row.adType || ''}
                        onChange={(e) => updateCreativeRow(row._id, 'adType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select ad type...</option>
                        {CAMPAIGN_OBJECTIVES.map(obj => (
                          <option key={obj.key} value={obj.key}>{obj.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Creative Type & Sub-Type */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Creative Type */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Type className="w-4 h-4 text-gray-400" />
                        Creative Type
                      </label>
                      <select
                        value={row.creativeType}
                        onChange={(e) => updateCreativeRow(row._id, 'creativeType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {CREATIVE_TYPES.map(type => (
                          <option key={type.key} value={type.key}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-Type */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FileImage className="w-4 h-4 text-gray-400" />
                        Sub Type
                      </label>
                      <select
                        value={row.subType || ''}
                        onChange={(e) => updateCreativeRow(row._id, 'subType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select sub-type...</option>
                        {subTypes.map(subType => (
                          <option key={subType} value={subType}>{subType}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Screen Sizes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Monitor className="w-4 h-4 text-gray-400" />
                      Screen Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FLAT_SCREEN_SIZES.map(size => {
                        const isSelected = (row.screenSizes || []).includes(size.key);
                        return (
                          <button
                            key={size.key}
                            onClick={() => toggleScreenSize(row._id, size.key)}
                            className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                              isSelected
                                ? 'bg-primary-100 border-primary-300 text-primary-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-primary-50'
                            }`}
                          >
                            {size.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 4: Assigned Role & Team Members */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Assigned Role */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        Assigned Role
                      </label>
                      <select
                        value={row.assignedRole || ''}
                        onChange={(e) => updateCreativeRow(row._id, 'assignedRole', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Select role...</option>
                        {CREATIVE_ROLES.map(role => (
                          <option key={role.key} value={role.key}>{role.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Team Members - Read-only display of Admin-assigned members */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        Assigned Team Member
                      </label>
                      {row.assignedRole ? (
                        <div className="space-y-1">
                          {/* Display assigned members as read-only */}
                          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            {assignedMembers.length > 0 ? (
                              assignedMembers.map(member => (
                                <Badge
                                  key={member._id}
                                  variant="primary"
                                  className="text-sm bg-blue-100 text-blue-800 border border-blue-300"
                                >
                                  {member.name}
                                  <span className="ml-1 text-blue-500">★</span>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-amber-600 italic">
                                ⚠️ No team member assigned for this role. Contact Admin to assign.
                              </span>
                            )}
                          </div>
                          {assignedMembers.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Team member(s) assigned by Admin during project creation
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Select a role to see assigned team member
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <Textarea
                      value={row.notes || ''}
                      onChange={(e) => updateCreativeRow(row._id, 'notes', e.target.value)}
                      placeholder="Add any notes or instructions..."
                      rows={2}
                    />
                  </div>
                </CardBody>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Creative Button */}
      <Button
        variant="outline"
        onClick={addCreativeRow}
        className="w-full py-3 border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Creative
      </Button>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
        </CardHeader>
        <CardBody>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Add any additional notes or instructions for the creative strategy..."
            rows={4}
          />
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          Save Progress
        </Button>
        <Button
          onClick={() => handleSave(true)}
          disabled={saving || isCompleted}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete & Continue
        </Button>
      </div>
    </div>
  );
}