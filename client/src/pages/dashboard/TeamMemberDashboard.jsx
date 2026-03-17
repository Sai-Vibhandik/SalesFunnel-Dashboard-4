import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectService, taskService } from '@/services/api';
import { Card, CardBody, Button, Badge, ProgressBar, Spinner } from '@/components/ui';
import {
  FolderKanban,
  Clock,
  Play,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Palette,
  Code,
  Bug,
  FileText,
  Upload,
  Send,
  Eye,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const ROLE_CONFIG = {
  content_writer: {
    icon: FileText,
    color: 'emerald',
    title: 'Content Writer Dashboard',
    taskTypes: ['content_creation'],
    actions: ['view_tasks', 'submit_content']
  },
  content_creator: {
    icon: FileText,
    color: 'blue',
    title: 'Content Creator Dashboard',
    taskTypes: ['content_creation', 'content_writing'],
    actions: ['view_tasks', 'submit_content']
  },
  ui_ux_designer: {
    icon: Palette,
    color: 'purple',
    title: 'UI/UX Designer Dashboard',
    taskTypes: ['landing_page_design'],
    actions: ['view_tasks', 'upload_design']
  },
  graphic_designer: {
    icon: Palette,
    color: 'pink',
    title: 'Designer Dashboard',
    taskTypes: ['graphic_design'],
    actions: ['view_tasks', 'upload_creative']
  },
  video_editor: {
    icon: FileText,
    color: 'cyan',
    title: 'Video Editor Dashboard',
    taskTypes: ['video_editing'],
    actions: ['view_tasks', 'upload_video']
  },
  developer: {
    icon: Code,
    color: 'green',
    title: 'Developer Dashboard',
    taskTypes: ['landing_page_development'],
    actions: ['view_tasks', 'upload_code']
  },
  tester: {
    icon: Bug,
    color: 'orange',
    title: 'Tester Dashboard',
    taskTypes: [], // Testers review all task types
    actions: ['view_pending', 'approve_reject']
  }
};

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
  approved_by_tester: { label: 'Tester Approved', color: 'bg-purple-100 text-purple-800' },
  final_approved: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  // Creative task status
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  // Content workflow
  content_pending: { label: 'Content Pending', color: 'bg-orange-100 text-orange-800' },
  content_submitted: { label: 'Content Review', color: 'bg-yellow-100 text-yellow-800' },
  content_approved: { label: 'Content Approved', color: 'bg-purple-100 text-purple-800' },
  content_rejected: { label: 'Content Rejected', color: 'bg-red-100 text-red-800' },
  // Design workflow
  design_pending: { label: 'Design Pending', color: 'bg-orange-100 text-orange-800' },
  design_submitted: { label: 'Design Review', color: 'bg-yellow-100 text-yellow-800' },
  design_approved: { label: 'Design Approved', color: 'bg-purple-100 text-purple-800' },
  design_rejected: { label: 'Design Rejected', color: 'bg-red-100 text-red-800' },
  // Development workflow
  development_pending: { label: 'Dev Pending', color: 'bg-orange-100 text-orange-800' },
  development_submitted: { label: 'Dev Review', color: 'bg-yellow-100 text-yellow-800' },
  development_approved: { label: 'Dev Approved', color: 'bg-purple-100 text-purple-800' }
};

export default function TeamMemberDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pendingReview, setPendingReview] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pendingTasks: 0,
    inProgressTasks: 0
  });

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.graphic_designer;
  const Icon = roleConfig.icon;
  const isTester = user?.role === 'tester';

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const projectsRes = await projectService.getProjects({ limit: 50 });
      const assignedProjects = projectsRes.data || [];
      setProjects(assignedProjects);

      // Fetch tasks based on role
      let assignedTasks = [];
      let reviewTasks = [];

      if (isTester) {
        // Testers need both pending review tasks and their assigned tasks
        const [reviewRes, myTasksRes] = await Promise.all([
          taskService.getPendingReview(),
          taskService.getMyRoleTasks ? taskService.getMyRoleTasks() : taskService.getMyTasks()
        ]);
        reviewTasks = reviewRes.data || [];
        assignedTasks = myTasksRes.data || [];
        setPendingReview(reviewTasks);
      } else {
        // All team members (including content_writer): use my-role-tasks to get tasks by assignedRole
        // Tasks are created in the Task collection by generateTasksFromStrategy when Creative Strategy is completed
        const tasksRes = taskService.getMyRoleTasks
          ? await taskService.getMyRoleTasks()
          : await taskService.getMyTasks();
        assignedTasks = tasksRes.data || [];
      }

      setTasks(assignedTasks);

      // Calculate stats
      const total = assignedProjects.length;
      const active = assignedProjects.filter(p => p.isActive && p.status === 'active').length;
      const completed = assignedProjects.filter(p => p.status === 'completed').length;
      const pendingTasks = assignedTasks.filter(t =>
        ['todo', 'design_pending', 'development_pending', 'content_pending', 'pending'].includes(t.status)
      ).length;
      const inProgressTasks = assignedTasks.filter(t =>
        ['in_progress', 'submitted', 'design_submitted', 'development_submitted', 'content_submitted'].includes(t.status)
      ).length;

      setStats({ total, active, completed, pendingTasks, inProgressTasks });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {roleConfig.title}
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Team Member'}! Here's your work overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            <FolderKanban className="w-4 h-4 mr-2" />
            Projects
          </Button>
          <Button onClick={() => navigate('/tasks')}>
            <Clock className="w-4 h-4 mr-2" />
            My Tasks
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className={`p-3 bg-${roleConfig.color}-100 rounded-lg`}>
                <Icon className={`w-6 h-6 text-${roleConfig.color}-600`} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Projects</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tester: Pending Review Section */}
      {isTester && pendingReview.length > 0 && (
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Review ({pendingReview.length})
              </h2>
              <Button variant="secondary" size="sm" onClick={() => navigate('/tasks/review')}>
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {pendingReview.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{task.taskTitle}</p>
                    <p className="text-sm text-gray-500">
                      {task.projectId?.businessName || 'Unknown Project'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => navigate('/tasks/review')}>
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* My Tasks Section */}
      {tasks.length > 0 && (
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.role === 'content_writer' ? 'My Creative Assignments' : 'My Tasks'}
              </h2>
              <Button variant="secondary" size="sm" onClick={() => navigate('/tasks')}>
                View All Tasks
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => {
                // Check if this is a creative task from CreativeStrategy
                const isCreativeTask = task.taskType === 'content_generation' || task.creativeType;

                return (
                  <div key={task._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(task.status)}
                        <span className="text-sm text-gray-500">
                          {isCreativeTask
                            ? `${task.creativeType || 'Creative'} • ${task.subType || task.taskType}`
                            : task.taskType?.replace(/_/g, ' ')
                          }
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {isCreativeTask ? task.creativeName : task.taskTitle}
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.projectId?.businessName || task.projectId?.projectName || 'Unknown Project'}
                        {task.platforms && task.platforms.length > 0 && (
                          <span className="ml-2">
                            • {task.platforms.join(', ')}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="ml-2">
                            • Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-gray-400 mt-1 line-clamp-1">{task.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCreativeTask ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/creatives?projectId=${task.projectId?._id || task.projectId}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Creative
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          View Task
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Active Projects */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects
            .filter(p => p.isActive && p.status === 'active')
            .slice(0, 6)
            .map((project) => (
              <Card
                key={project._id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {project.projectName || project.businessName}
                      </h3>
                      <p className="text-sm text-gray-500">{project.customerName}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.overallProgress}%</span>
                    </div>
                    <ProgressBar
                      value={project.overallProgress}
                      size="sm"
                      color={project.overallProgress === 100 ? 'success' : 'primary'}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {formatDate(project.updatedAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project._id}`);
                      }}
                    >
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
        </div>
      </div>

      {/* No Tasks State */}
      {tasks.length === 0 && !isTester && (
        <Card>
          <CardBody className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Assigned</h3>
              <p className="text-gray-600 mb-4">
                You haven't been assigned any tasks yet. Tasks will appear here once they're created.
              </p>
              <Button variant="secondary" onClick={() => navigate('/projects')}>
                View Projects
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}