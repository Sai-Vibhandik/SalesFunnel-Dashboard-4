import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { projectService, taskService } from '@/services/api';
import { Card, CardBody, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import ProjectSummary from './ProjectSummary';
import {
  ArrowLeft, ClipboardList, Play, CheckCircle, Clock,
  Eye, Palette, Code
} from 'lucide-react';

const TASK_TYPES = {
  graphic_design: { label: 'Graphic Design', icon: Palette },
  video_editing: { label: 'Video Editing', icon: Palette },
  landing_page_design: { label: 'Landing Page Design', icon: Eye },
  landing_page_development: { label: 'Landing Page Development', icon: Code },
  content_creation: { label: 'Content Creation', icon: ClipboardList },
  content_writing: { label: 'Content Writing', icon: ClipboardList },
};

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
  approved_by_tester: { label: 'Tester Approved', color: 'bg-purple-100 text-purple-800' },
  final_approved: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  content_pending: { label: 'Content Pending', color: 'bg-orange-100 text-orange-800' },
  content_submitted: { label: 'Content Submitted', color: 'bg-yellow-100 text-yellow-800' },
  content_approved: { label: 'Content Approved', color: 'bg-purple-100 text-purple-800' },
  content_rejected: { label: 'Content Rejected', color: 'bg-red-100 text-red-800' },
  content_final_approved: { label: 'Content Final Approved', color: 'bg-green-100 text-green-800' },
  design_pending: { label: 'Design Pending', color: 'bg-orange-100 text-orange-800' },
  design_submitted: { label: 'Design Submitted', color: 'bg-yellow-100 text-yellow-800' },
  design_approved: { label: 'Design Approved', color: 'bg-purple-100 text-purple-800' },
  design_rejected: { label: 'Design Rejected', color: 'bg-red-100 text-red-800' },
  development_pending: { label: 'Dev Pending', color: 'bg-orange-100 text-orange-800' },
  development_submitted: { label: 'Dev Submitted', color: 'bg-yellow-100 text-yellow-800' },
  development_approved: { label: 'Dev Approved', color: 'bg-purple-100 text-purple-800' },
};

export default function TeamMemberProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('summary');

  const isDeveloper = user?.role === 'developer';
  const isGraphicDesigner = user?.role === 'graphic_designer';
  const isUIDesigner = user?.role === 'ui_ux_designer';
  const isContentWriter = user?.role === 'content_writer';
  const isVideoEditor = user?.role === 'video_editor';

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);

      // Fetch project and tasks in parallel
      const [projectRes, tasksRes] = await Promise.all([
        projectService.getProject(id),
        taskService.getProjectTasks(id)
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data || []);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on role
  const filteredTasks = tasks.filter(task => {
    if (isDeveloper) {
      // Developers only see landing page development tasks
      return task.taskType === 'landing_page_development';
    }
    if (isUIDesigner) {
      // UI/UX Designers only see landing page design tasks
      return task.taskType === 'landing_page_design';
    }
    if (isGraphicDesigner) {
      // Graphic Designers see graphic design tasks (images, carousels, offers)
      return task.taskType === 'graphic_design';
    }
    if (isVideoEditor) {
      // Video Editors see video editing tasks
      return task.taskType === 'video_editing';
    }
    if (isContentWriter) {
      // Content Writers see content_creation tasks
      return task.taskType === 'content_creation';
    }
    return false;
  });

  // Group tasks by status
  const pendingTasks = filteredTasks.filter(t =>
    ['todo', 'content_pending', 'design_pending', 'development_pending'].includes(t.status)
  );
  const inProgressTasks = filteredTasks.filter(t =>
    ['in_progress', 'submitted', 'content_submitted', 'design_submitted', 'development_submitted'].includes(t.status)
  );
  const completedTasks = filteredTasks.filter(t =>
    ['approved_by_tester', 'content_approved', 'design_approved', 'development_approved', 'final_approved', 'content_final_approved'].includes(t.status)
  );

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTaskTypeBadge = (taskType) => {
    const config = TASK_TYPES[taskType] || { label: taskType, icon: ClipboardList };
    const Icon = config.icon;
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
        <Icon className="w-3 h-3" />
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

  if (!project) {
    return null;
  }

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
            </div>
            <p className="text-gray-600 mt-1">{project.customerName}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Project Summary
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Tasks ({filteredTasks.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <ProjectSummary projectId={id} />
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Task Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
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
                    <p className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Play className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tasks assigned to you for this project</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <Card key={task._id} className="hover:shadow-md transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTaskTypeBadge(task.taskType)}
                          {getStatusBadge(task.status)}
                        </div>
                        <h3 className="font-semibold text-gray-900">{task.taskTitle}</h3>
                        {task.dueDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}

                        {/* Strategy Context Preview */}
                        {task.strategyContext && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {task.strategyContext.platform && (
                                <div>
                                  <span className="text-gray-500">Platform:</span>{' '}
                                  <span className="font-medium">{task.strategyContext.platform}</span>
                                </div>
                              )}
                              {task.strategyContext.hook && (
                                <div>
                                  <span className="text-gray-500">Hook:</span>{' '}
                                  <span className="font-medium">{task.strategyContext.hook.substring(0, 30)}...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Task
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}