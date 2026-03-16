import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services/api';
import { Card, CardBody, CardHeader, Button, Badge, ProgressBar, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ProjectSummary, TeamMemberProjectView, TesterProjectView } from '@/components/project';
import LandingPagesSection from '@/components/landing-pages/LandingPagesSection';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Search,
  Gift,
  TrendingUp,
  FileText,
  Lightbulb,
  CheckCircle,
  Lock,
  Users,
  UserPlus,
  Play,
} from 'lucide-react';
import { formatDate, getStageName, STAGE_ORDER } from '@/lib/utils';

const STAGE_ICONS = {
  onboarding: CheckCircle,
  marketResearch: Search,
  offerEngineering: Gift,
  trafficStrategy: TrendingUp,
  landingPage: FileText,
  creativeStrategy: Lightbulb,
};

const STAGE_PATHS = {
  onboarding: '/projects',
  marketResearch: '/market-research',
  offerEngineering: '/offer-engineering',
  trafficStrategy: '/traffic-strategy',
  landingPage: '/landing-pages',
  creativeStrategy: '/creative-strategy',
};

// Note: landingPage now redirects to /landing-pages (list) instead of /landing-page-strategy (single)

const STAGE_NAMES = {
  onboarding: 'Customer Onboarding',
  marketResearch: 'Market Research',
  offerEngineering: 'Offer Engineering',
  trafficStrategy: 'Traffic Strategy',
  landingPage: 'Landing Page & Lead Capture',
  creativeStrategy: 'Creative Strategy Execution'
};

// Role labels
const ROLE_LABELS = {
  performanceMarketer: 'Performance Marketer',
  contentCreator: 'Content Creator',
  contentWriter: 'Content Writer',
  uiUxDesigner: 'UI/UX Designer',
  graphicDesigner: 'Graphic Designer',
  videoEditor: 'Video Editor',
  developer: 'Developer',
  tester: 'Tester',
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isPerformanceMarketer = user?.role === 'performance_marketer';
  const isDesigner = user?.role === 'graphic_designer' || user?.role === 'ui_ux_designer';
  const isDeveloper = user?.role === 'developer';
  const isTester = user?.role === 'tester';
  const isTeamMember = isDesigner || isDeveloper || isTester;

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProject(id);
      setProject(response.data);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleActivate = async () => {
    try {
      await projectService.toggleActivation(id, true);
      toast.success('Project activated successfully');
      fetchProject();
    } catch (error) {
      toast.error('Failed to activate project');
    }
  };

  // Handle landing pages CRUD
  const handleLandingPagesSave = async (action, index, data) => {
    try {
      if (action === 'add') {
        await projectService.addLandingPage(id, data);
      } else if (action === 'update') {
        const landingPageId = project.landingPages[index]._id;
        await projectService.updateLandingPage(id, landingPageId, data);
      } else if (action === 'delete') {
        const landingPageId = project.landingPages[index]._id;
        await projectService.deleteLandingPage(id, landingPageId);
      }
      // Refresh project data
      const response = await projectService.getProject(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error saving landing page:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Generate stage status from project stages
  const stageKeys = ['onboarding', 'marketResearch', 'offerEngineering', 'trafficStrategy', 'landingPage', 'creativeStrategy'];
  const stages = stageKeys.map((key, index) => {
    const stageData = project.stages[key] || {};
    const isCompleted = stageData.isCompleted || false;
    const isAccessible = index === 0 || (project.stages[stageKeys[index - 1]]?.isCompleted);

    return {
      key,
      name: STAGE_NAMES[key],
      order: index + 1,
      isCompleted,
      isAccessible,
      completedAt: stageData.completedAt,
      isLocked: !isAccessible
    };
  });

  // Role-based views
  // Tester: Show TesterProjectView
  if (isTester) {
    return <TesterProjectView />;
  }

  // Designer/Developer: Show TeamMemberProjectView
  if (isDesigner || isDeveloper) {
    return <TeamMemberProjectView />;
  }

  // Performance Marketer & Admin: Show full project management
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.projectName || project.businessName}
              </h1>
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
              {project.isActive ? (
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">{project.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <>
              <Button
                variant="secondary"
                onClick={() => navigate(`/projects/${id}/assign-team`)}
              >
                <Users className="w-4 h-4 mr-2" />
                Assign Team
              </Button>
              {!project.isActive && project.assignedTeam?.performanceMarketer && (
                <Button onClick={handleActivate}>
                  <Play className="w-4 h-4 mr-2" />
                  Activate
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => navigate(`/projects/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Project Progress</h2>
            <span className="text-2xl font-bold text-primary-600">
              {project.overallProgress}%
            </span>
          </div>
          <ProgressBar
            value={project.overallProgress}
            color={project.overallProgress >= 100 ? 'success' : 'primary'}
            size="lg"
          />
          <div className="mt-6">
            <StageProgressTracker stages={project.stages} currentStage={project.currentStage} />
          </div>
        </CardBody>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500">Customer Name</label>
              <p className="mt-1 font-medium text-gray-900">{project.customerName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Business Name</label>
              <p className="mt-1 font-medium text-gray-900">{project.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="mt-1 font-medium text-gray-900">{project.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Mobile</label>
              <p className="mt-1 font-medium text-gray-900">{project.mobile}</p>
            </div>
            {project.industry && (
              <div>
                <label className="text-sm text-gray-500">Industry</label>
                <p className="mt-1 font-medium text-gray-900">{project.industry}</p>
              </div>
            )}
            {project.budget && (
              <div>
                <label className="text-sm text-gray-500">Budget</label>
                <p className="mt-1 font-medium text-gray-900">${project.budget.toLocaleString()}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">Created</label>
              <p className="mt-1 font-medium text-gray-900">{formatDate(project.createdAt)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Team Assignment - Admin View */}
      {isAdmin && project.assignedTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Assigned Team</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/projects/${id}/assign-team`)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {project.assignedTeam.performanceMarketer ||
            project.assignedTeam.uiUxDesigner ||
            project.assignedTeam.graphicDesigner ||
            project.assignedTeam.developer ||
            project.assignedTeam.tester ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(project.assignedTeam).map(([role, member]) => (
                  member && (
                    <div key={role} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{ROLE_LABELS[role]}</p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No team members assigned yet</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => navigate(`/projects/${id}/assign-team`)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Team
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Project Summary for Performance Marketer */}
      {isPerformanceMarketer && (
        <ProjectSummary projectId={id} />
      )}

      {/* Landing Pages Section - For Performance Marketer */}
      {isPerformanceMarketer && project?.stages?.trafficStrategy?.isCompleted && (
        <LandingPagesSection
          projectId={id}
          landingPages={project?.landingPages || []}
          onSave={handleLandingPagesSave}
          loading={loading}
        />
      )}

      {/* Workflow Stages - Only for Non-Admin Performance Marketer */}
      {!isAdmin && isPerformanceMarketer && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">Workflow Stages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stages.slice(1).map((stage, index) => {
              const Icon = STAGE_ICONS[stage.key] || CheckCircle;
              const isAccessible = stage.isAccessible;
              const isCompleted = stage.isCompleted;

              return (
                <Card
                  key={stage.key}
                  className={`relative overflow-hidden transition-all ${
                    isAccessible ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
                  }`}
                  onClick={() => {
                    if (isAccessible) {
                      navigate(`${STAGE_PATHS[stage.key]}?projectId=${id}`);
                    }
                  }}
                >
                  {!isAccessible && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <CardBody className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          isCompleted
                            ? 'bg-green-100 text-green-600'
                            : isAccessible
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                          {isCompleted && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Stage {stage.order} of 6
                        </p>
                        {isAccessible && !isCompleted && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`${STAGE_PATHS[stage.key]}?projectId=${id}`);
                            }}
                          >
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Admin Message */}
      {isAdmin && (
        <Card>
          <CardBody className="p-6 text-center">
            <Users className="w-12 h-12 mx-auto text-primary-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Team Workflow Management
            </h3>
            <p className="text-gray-600 mb-4">
              As an admin, you manage customer onboarding and team assignments.
              Strategy stages (Market Research, Offer Engineering, etc.) are handled by your team.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate(`/projects/${id}/assign-team`)}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/team')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                View All Team Members
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}