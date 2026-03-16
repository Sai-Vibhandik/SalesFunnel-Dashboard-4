import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, projectService } from '@/services/api';
import { Card, CardBody, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import { ArrowLeft, Users, UserPlus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractData } from '@/utils/apiResponse';

// Role configuration - keys match the backend User role values (underscore)
// label is the display name
// assignedTeamField is the corresponding field name in Project.assignedTeam (plural for arrays)
const ROLE_CONFIG = {
  performance_marketer: {
    label: 'Performance Marketer',
    assignedTeamField: 'performanceMarketers',
    legacyField: 'performanceMarketer',
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  content_writer: {
    label: 'Content Writer',
    assignedTeamField: 'contentWriters',
    legacyField: 'contentWriter',
    color: 'bg-emerald-100 text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  ui_ux_designer: {
    label: 'UI/UX Designer',
    assignedTeamField: 'uiUxDesigners',
    legacyField: 'uiUxDesigner',
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-200',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  graphic_designer: {
    label: 'Graphic Designer',
    assignedTeamField: 'graphicDesigners',
    legacyField: 'graphicDesigner',
    color: 'bg-pink-100 text-pink-700',
    borderColor: 'border-pink-200',
    bgColor: 'rgba(236, 72, 153, 0.1)',
  },
  video_editor: {
    label: 'Video Editor',
    assignedTeamField: 'videoEditors',
    legacyField: 'videoEditor',
    color: 'bg-cyan-100 text-cyan-700',
    borderColor: 'border-cyan-200',
    bgColor: 'rgba(6, 182, 212, 0.1)',
  },
  developer: {
    label: 'Developer',
    assignedTeamField: 'developers',
    legacyField: 'developer',
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-green-200',
    bgColor: 'rgba(34, 197, 94, 0.1)',
  },
  tester: {
    label: 'Tester',
    assignedTeamField: 'testers',
    legacyField: 'tester',
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-orange-200',
    bgColor: 'rgba(249, 115, 22, 0.1)',
  },
};

export default function TeamAssignmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [teamByRole, setTeamByRole] = useState({});
  const [selectedTeam, setSelectedTeam] = useState({}); // { roleKey: [memberId1, memberId2, ...] }

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectRes, teamRes] = await Promise.all([
        projectService.getProject(id),
        authService.getTeamByRole()
      ]);

      console.log('=== TeamAssignmentPage fetchData ===');
      console.log('projectRes (raw):', projectRes);
      console.log('teamRes (raw):', teamRes);

      // Extract data using utility
      const projectData = extractData(projectRes);
      const teamData = extractData(teamRes);

      console.log('projectData (extracted):', projectData);
      console.log('projectData.assignedTeam:', projectData?.assignedTeam);
      console.log('teamData (extracted):', teamData);
      console.log('teamData roles:', teamData ? Object.keys(teamData) : 'N/A');

      // Log team members for each role
      ['content_writer', 'graphic_designer', 'video_editor', 'performance_marketer'].forEach(role => {
        console.log(`teamData.${role}:`, teamData?.[role]?.length || 0, 'members');
      });

      setProject(projectData);
      setTeamByRole(teamData || {});

      // Set currently assigned team - map from assignedTeam arrays to role keys
      if (projectData?.assignedTeam) {
        const assignedTeam = {};
        Object.entries(ROLE_CONFIG).forEach(([roleKey, config]) => {
          const arrayField = config.assignedTeamField;
          const legacyField = config.legacyField;

          // Check for new array field first
          if (projectData.assignedTeam[arrayField] && Array.isArray(projectData.assignedTeam[arrayField])) {
            assignedTeam[roleKey] = projectData.assignedTeam[arrayField].map(m => m._id || m);
          }
          // Fall back to legacy single field
          else if (projectData.assignedTeam[legacyField]) {
            const legacyMember = projectData.assignedTeam[legacyField];
            assignedTeam[roleKey] = [legacyMember._id || legacyMember];
          } else {
            assignedTeam[roleKey] = [];
          }
        });
        setSelectedTeam(assignedTeam);
        console.log('selectedTeam set to:', assignedTeam);
      } else {
        console.log('No assignedTeam in projectData');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  // Toggle member selection (multi-select)
  const toggleMember = (role, memberId) => {
    setSelectedTeam(prev => {
      const currentMembers = prev[role] || [];
      const isSelected = currentMembers.includes(memberId);

      return {
        ...prev,
        [role]: isSelected
          ? currentMembers.filter(id => id !== memberId) // Remove if selected
          : [...currentMembers, memberId] // Add if not selected
      };
    });
  };

  // Remove a member from selection
  const removeMember = (role, memberId) => {
    setSelectedTeam(prev => ({
      ...prev,
      [role]: (prev[role] || []).filter(id => id !== memberId)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert selectedTeam (role keys) to assignedTeam fields (arrays)
      const assignedTeamData = {};

      console.log('=== TeamAssignmentPage handleSave ===');
      console.log('selectedTeam:', selectedTeam);

      Object.entries(ROLE_CONFIG).forEach(([roleKey, config]) => {
        // Ensure all IDs are strings
        const memberIds = (selectedTeam[roleKey] || []).map(id =>
          typeof id === 'object' && id !== null ? (id._id?.toString() || id.toString()) : String(id)
        );
        assignedTeamData[config.assignedTeamField] = memberIds;
        // Also set legacy field for backward compatibility
        assignedTeamData[config.legacyField] = memberIds[0] || null;
        console.log(`Role ${roleKey}: ${config.assignedTeamField} =`, memberIds);
      });

      console.log('Sending assignedTeamData:', assignedTeamData);

      await projectService.assignTeam(id, assignedTeamData);
      toast.success('Team assigned successfully!');
      navigate('/projects');
    } catch (error) {
      console.error('handleSave error:', error);
      toast.error(error.message || 'Failed to assign team');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      await projectService.toggleActivation(id, true);
      toast.success('Project activated successfully!');
      navigate('/projects');
    } catch (error) {
      toast.error(error.message || 'Failed to activate project');
    }
  };

  const hasPerformanceMarketer = Object.entries(ROLE_CONFIG).some(([roleKey, config]) => {
    return config.assignedTeamField === 'performanceMarketers' && (selectedTeam[roleKey] || []).length > 0;
  });

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
        <Button
          variant="ghost"
          onClick={() => navigate('/projects')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Assign Team</h1>
          <p className="text-gray-600 mt-1">
            Select team members for each role. You can assign multiple people to each role.
          </p>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {project.projectName || project.businessName}
              </h2>
              <p className="text-gray-500 mt-1">{project.customerName} • {project.email}</p>
              {project.industry && (
                <Badge className="mt-2">{project.industry}</Badge>
              )}
            </div>
            <Badge variant={project.isActive ? 'success' : 'default'}>
              {project.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {project.description && (
            <p className="text-gray-600 mt-4">{project.description}</p>
          )}
        </CardBody>
      </Card>

      {/* Team Assignment */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Team Assignment</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Select multiple team members for each role. Click on a member to toggle selection.
          </p>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-6">
            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
              <div key={roleKey}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    {config.label}
                    {(selectedTeam[roleKey] || []).length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({selectedTeam[roleKey].length} selected)
                      </span>
                    )}
                  </h4>
                </div>

                {/* Selected members badges */}
                {(selectedTeam[roleKey] || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTeam[roleKey].map(memberId => {
                      const member = teamByRole[roleKey]?.find(m => m._id === memberId);
                      return member ? (
                        <Badge
                          key={memberId}
                          variant="primary"
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          {member.name}
                          <button
                            onClick={() => removeMember(roleKey, memberId)}
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {teamByRole[roleKey]?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teamByRole[roleKey].map((member) => {
                      const isSelected = (selectedTeam[roleKey] || []).includes(member._id);
                      return (
                        <button
                          key={member._id}
                          onClick={() => toggleMember(roleKey, member._id)}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                            isSelected
                              ? `${config.borderColor}`
                              : 'border-gray-100 hover:border-gray-200'
                          )}
                          style={{
                            backgroundColor: isSelected ? config.bgColor : 'white'
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {member.email}
                            </p>
                            {member.specialization && (
                              <p className="text-xs text-gray-400 truncate">
                                {member.specialization}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center',
                              config.color.split(' ')[0]
                            )}>
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No team members available for this role. Add team members in Team Management.
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/projects')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
        >
          <Users className="w-4 h-4 mr-2" />
          Save Team Assignment
        </Button>
        {hasPerformanceMarketer && !project.isActive && (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleActivate}
          >
            Activate Project
          </Button>
        )}
      </div>
    </div>
  );
}