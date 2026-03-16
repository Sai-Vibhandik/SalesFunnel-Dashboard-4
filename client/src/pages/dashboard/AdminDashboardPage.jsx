import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, projectService, notificationService, strategyService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, Spinner, Button, Badge } from '@/components/ui';
import {
  TrendingUp,
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  MoreHorizontal,
  ChevronRight,
  UserPlus,
  Settings,
  Activity,
  Briefcase,
  X,
  Eye,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

// Stat Card Component
function StatCard({ title, value, change, changeType, icon: Icon, iconBg }) {
  const isPositive = changeType === 'positive';
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUpRight size={16} className="text-green-500" />
              ) : (
                <ArrowDownRight size={16} className="text-red-500" />
              )}
              <span className={cn('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
                {change}
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-2xl', iconBg)}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// Team Member Card
function TeamMemberCard({ member, onClick }) {
  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    performance_marketer: 'bg-blue-100 text-blue-700',
    ui_ux_designer: 'bg-purple-100 text-purple-700',
    graphic_designer: 'bg-pink-100 text-pink-700',
    developer: 'bg-green-100 text-green-700',
    tester: 'bg-orange-100 text-orange-700',
  };

  const roleLabels = {
    admin: 'Admin',
    performance_marketer: 'Performance Marketer',
    ui_ux_designer: 'UI/UX Designer',
    graphic_designer: 'Graphic Designer',
    developer: 'Developer',
    tester: 'Tester',
  };

  const availabilityColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
            {member.name?.charAt(0).toUpperCase()}
          </div>
          <div className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
            availabilityColors[member.availability]
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
          <p className="text-sm text-gray-500 truncate">{member.email}</p>
        </div>
        <Badge className={cn('text-xs', roleColors[member.role])}>
          {roleLabels[member.role]}
        </Badge>
      </div>
      {member.specialization && (
        <p className="mt-2 text-xs text-gray-400">{member.specialization}</p>
      )}
    </div>
  );
}

// Project Card Component
function ProjectCard({ project, onClick }) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{project.projectName || project.businessName}</h3>
          <p className="text-sm text-gray-500">{project.customerName}</p>
        </div>
        <div className="flex items-center gap-2">
          {project.isActive ? (
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
          )}
          <Badge className={cn('text-xs', statusColors[project.status])}>
            {project.status}
          </Badge>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-900">{project.overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.overallProgress}%`,
              background: project.overallProgress >= 100
                ? '#10B981'
                : 'linear-gradient(90deg, #FFC107 0%, #FFD54F 100%)'
            }}
          />
        </div>
      </div>
      {project.industry && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Industry: {project.industry}</span>
        </div>
      )}
    </div>
  );
}

// Strategy Detail Modal Component
function StrategyDetailModal({ strategy, onClose, onReview }) {
  const [reviewing, setReviewing] = useState(false);

  const handleReview = async () => {
    try {
      setReviewing(true);
      await strategyService.markReviewed(strategy.project._id);
      toast.success('Strategy marked as reviewed');
      onReview();
    } catch (error) {
      toast.error(error.message || 'Failed to mark as reviewed');
    } finally {
      setReviewing(false);
    }
  };

  if (!strategy) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Strategy Review: {strategy.project.projectName || strategy.project.businessName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Completed by: {strategy.completedBy?.name || 'Unknown'} • {formatDate(strategy.project.strategyCompletedAt)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Stage Progress */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stage Progress</h3>
            <div className="grid grid-cols-6 gap-2">
              {strategy.project.stageStatus?.map((stage, index) => (
                <div key={stage.key} className="text-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-medium',
                    stage.isCompleted
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  )}>
                    {stage.isCompleted ? <CheckCircle size={16} /> : index + 1}
                  </div>
                  <p className="text-xs mt-1 text-gray-500 truncate">{stage.name.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Research Summary */}
          {strategy.stages.marketResearch?.data && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Market Research</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {strategy.stages.marketResearch.data.avatar && (
                  <>
                    <div>
                      <span className="text-gray-500">Target Audience:</span>{' '}
                      <span className="text-gray-900">
                        {strategy.stages.marketResearch.data.avatar.ageRange}, {strategy.stages.marketResearch.data.avatar.profession}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>{' '}
                      <span className="text-gray-900">{strategy.stages.marketResearch.data.avatar.location}</span>
                    </div>
                  </>
                )}
              </div>
              {strategy.stages.marketResearch.data.painPoints?.length > 0 && (
                <div className="mt-2">
                  <span className="text-gray-500 text-sm">Pain Points:</span>{' '}
                  <span className="text-gray-900 text-sm">{strategy.stages.marketResearch.data.painPoints.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Offer Engineering Summary */}
          {strategy.stages.offerEngineering?.data && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Offer Engineering</h4>
              <div className="text-sm text-gray-700">
                {strategy.stages.offerEngineering.data.headline && (
                  <p><span className="text-gray-500">Headline:</span> {strategy.stages.offerEngineering.data.headline}</p>
                )}
                {strategy.stages.offerEngineering.data.mainOffer && (
                  <p className="mt-1"><span className="text-gray-500">Main Offer:</span> {strategy.stages.offerEngineering.data.mainOffer}</p>
                )}
              </div>
            </div>
          )}

          {/* Traffic Strategy Summary */}
          {strategy.stages.trafficStrategy?.data && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Traffic Strategy</h4>
              <div className="text-sm text-gray-700">
                {strategy.stages.trafficStrategy.data.channels && (
                  <p>
                    <span className="text-gray-500">Channels:</span>{' '}
                    {Object.entries(strategy.stages.trafficStrategy.data.channels)
                      .filter(([_, v]) => v?.enabled)
                      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                      .join(', ') || 'None selected'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Landing Page Summary */}
          {strategy.stages.landingPage?.data && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Landing Page</h4>
              <div className="text-sm text-gray-700">
                {strategy.stages.landingPage.data.headline && (
                  <p><span className="text-gray-500">Headline:</span> {strategy.stages.landingPage.data.headline}</p>
                )}
                {strategy.stages.landingPage.data.subheadline && (
                  <p className="mt-1"><span className="text-gray-500">Subheadline:</span> {strategy.stages.landingPage.data.subheadline}</p>
                )}
              </div>
            </div>
          )}

          {/* Creative Strategy Summary */}
          {strategy.stages.creativeStrategy?.data && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Creative Strategy</h4>
              <div className="text-sm text-gray-700">
                {strategy.stages.creativeStrategy.data.adTypes?.length > 0 && (
                  <p><span className="text-gray-500">Ad Types:</span> {strategy.stages.creativeStrategy.data.adTypes.map(at => at.typeName).join(', ')}</p>
                )}
                {strategy.stages.creativeStrategy.data.creativeBrief && (
                  <p className="mt-1"><span className="text-gray-500">Brief:</span> {strategy.stages.creativeStrategy.data.creativeBrief.substring(0, 100)}...</p>
                )}
              </div>
            </div>
          )}

          {/* Team */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Assigned Team</h4>
            <div className="flex flex-wrap gap-3">
              {strategy.project.assignedTeam?.performanceMarketer && (
                <Badge className="bg-blue-100 text-blue-700">
                  PM: {strategy.project.assignedTeam.performanceMarketer.name}
                </Badge>
              )}
              {strategy.project.assignedTeam?.uiUxDesigner && (
                <Badge className="bg-purple-100 text-purple-700">
                  UI/UX: {strategy.project.assignedTeam.uiUxDesigner.name}
                </Badge>
              )}
              {strategy.project.assignedTeam?.graphicDesigner && (
                <Badge className="bg-pink-100 text-pink-700">
                  Design: {strategy.project.assignedTeam.graphicDesigner.name}
                </Badge>
              )}
              {strategy.project.assignedTeam?.developer && (
                <Badge className="bg-green-100 text-green-700">
                  Dev: {strategy.project.assignedTeam.developer.name}
                </Badge>
              )}
              {strategy.project.assignedTeam?.tester && (
                <Badge className="bg-orange-100 text-orange-700">
                  QA: {strategy.project.assignedTeam.tester.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleReview} loading={reviewing}>
            <CheckSquare size={16} className="mr-2" />
            Mark as Reviewed
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    recentProjects: [],
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({
    total: 0,
    byRole: {},
    available: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [strategyNotifications, setStrategyNotifications] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, teamRes, notifRes] = await Promise.all([
        projectService.getDashboardStats(),
        authService.getTeamMembers(),
        notificationService.getNotifications({ limit: 10 })
      ]);

      setStats(dashboardRes.data);

      // Calculate team statistics
      const members = teamRes.data || [];
      setTeamMembers(members);

      const teamByRole = {};
      let availableCount = 0;

      members.forEach(member => {
        teamByRole[member.role] = (teamByRole[member.role] || 0) + 1;
        if (member.availability === 'available') availableCount++;
      });

      setTeamStats({
        total: members.length,
        byRole: teamByRole,
        available: availableCount,
      });

      // Filter strategy completion notifications
      const allNotifications = notifRes.data || [];
      setNotifications(allNotifications);
      setStrategyNotifications(allNotifications.filter(n => n.type === 'strategy_completed'));

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStrategy = async (notification) => {
    try {
      const response = await strategyService.getCompleteStrategy(notification.projectId._id);
      setSelectedStrategy(response.data);
    } catch (error) {
      toast.error('Failed to load strategy details');
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setStrategyNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleStrategyReviewed = () => {
    setSelectedStrategy(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! Here's your team overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {strategyNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {strategyNotifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {strategyNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No new notifications
                    </div>
                  ) : (
                    strategyNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          handleViewStrategy(notification);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle size={16} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={() => navigate('/team')}>
            <Users size={18} className="mr-2" />
            Manage Team
          </Button>
          <Button onClick={() => navigate('/projects/new')}>
            <span className="mr-2">+</span> New Project
          </Button>
        </div>
      </div>

      {/* Strategy Completion Alerts */}
      {strategyNotifications.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">
                {strategyNotifications.length} Strategy{strategyNotifications.length > 1 ? 's' : ''} Completed
              </h3>
              <p className="text-sm text-green-600">
                {strategyNotifications.map(n => n.projectId?.projectName || n.projectId?.businessName).join(', ')}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleViewStrategy(strategyNotifications[0])}
            >
              <Eye size={16} className="mr-2" />
              Review
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={String(stats.totalProjects)}
          change="+8%"
          changeType="positive"
          icon={FolderKanban}
          iconBg="bg-gradient-to-br from-primary-400 to-primary-600"
        />
        <StatCard
          title="Active Projects"
          value={String(stats.activeProjects)}
          change="+12%"
          changeType="positive"
          icon={Activity}
          iconBg="bg-gradient-to-br from-green-400 to-green-600"
        />
        <StatCard
          title="Team Members"
          value={String(teamStats.total)}
          icon={Users}
          iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
        />
        <StatCard
          title="Available Members"
          value={String(teamStats.available)}
          icon={CheckCircle}
          iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        />
      </div>

      {/* Team Overview by Role */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries({
          admin: { label: 'Admins', color: 'bg-red-500' },
          performance_marketer: { label: 'Marketers', color: 'bg-blue-500' },
          ui_ux_designer: { label: 'UI/UX', color: 'bg-purple-500' },
          graphic_designer: { label: 'Designers', color: 'bg-pink-500' },
          developer: { label: 'Developers', color: 'bg-green-500' },
          tester: { label: 'Testers', color: 'bg-orange-500' },
        }).map(([role, config]) => (
          <div key={role} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-3 h-3 rounded-full', config.color)} />
              <span className="text-sm text-gray-600">{config.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {teamStats.byRole[role] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Projects and Team Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="chart-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                <p className="text-sm text-gray-500 mt-1">Latest project activity</p>
              </div>
              <Link
                to="/projects"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </Link>
            </div>

            {stats.recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto text-gray-300" />
                <h4 className="mt-2 font-medium text-gray-900">No projects yet</h4>
                <p className="text-sm text-gray-500 mt-1">Create your first project to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentProjects.slice(0, 5).map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-500 mt-1">Your team roster</p>
            </div>
            <button
              onClick={() => navigate('/team')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300" />
              <h4 className="mt-2 font-medium text-gray-900">No team members</h4>
              <p className="text-sm text-gray-500 mt-1">Add team members to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.slice(0, 5).map((member) => (
                <TeamMemberCard
                  key={member._id}
                  member={member}
                  onClick={() => navigate('/team')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/projects/new')}
          className="p-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl text-white text-left hover:shadow-lg transition-all duration-200"
        >
          <FolderKanban size={24} className="mb-2" />
          <p className="font-semibold">Create Project</p>
          <p className="text-sm text-white/80 mt-1">Start a new client project</p>
        </button>
        <button
          onClick={() => navigate('/team')}
          className="p-4 bg-dark-300 rounded-2xl text-white text-left hover:bg-dark-200 transition-all duration-200"
        >
          <UserPlus size={24} className="mb-2 text-primary-500" />
          <p className="font-semibold">Add Team Member</p>
          <p className="text-sm text-gray-400 mt-1">Invite new members</p>
        </button>
        <button
          onClick={() => navigate('/projects')}
          className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-left hover:border-primary-300 transition-all duration-200"
        >
          <Briefcase size={24} className="mb-2 text-green-500" />
          <p className="font-semibold">All Projects</p>
          <p className="text-sm text-gray-500 mt-1">View and manage projects</p>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-left hover:border-primary-300 transition-all duration-200"
        >
          <Settings size={24} className="mb-2 text-purple-500" />
          <p className="font-semibold">Settings</p>
          <p className="text-sm text-gray-500 mt-1">Configure your workspace</p>
        </button>
      </div>

      {/* Strategy Detail Modal */}
      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
          onReview={handleStrategyReviewed}
        />
      )}
    </div>
  );
}