import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { projectService, taskService } from '@/services/api';
import { Card, CardBody, CardHeader, Button, Badge, Spinner } from '@/components/ui';
import ProjectSummary from './ProjectSummary';
import {
  ArrowLeft, ClipboardCheck, CheckCircle, XCircle, Eye,
  Palette, Video, FileText, Layout, Code, Clock
} from 'lucide-react';

const TASK_TYPES = {
  graphic_design: { label: 'Graphic Design', icon: Palette },
  video_editing: { label: 'Video Editing', icon: Video },
  landing_page_design: { label: 'Landing Page Design', icon: Layout },
  landing_page_development: { label: 'Landing Page Development', icon: Code },
  content_writing: { label: 'Content Writing', icon: FileText },
};

const STATUS_CONFIG = {
  submitted: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  design_submitted: { label: 'Design Submitted', color: 'bg-yellow-100 text-yellow-800' },
  development_submitted: { label: 'Dev Submitted', color: 'bg-yellow-100 text-yellow-800' },
  approved_by_tester: { label: 'Tester Approved', color: 'bg-purple-100 text-purple-800' },
  design_approved: { label: 'Design Approved', color: 'bg-purple-100 text-purple-800' },
  development_approved: { label: 'Dev Approved', color: 'bg-purple-100 text-purple-800' },
  final_approved: { label: 'Fully Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
};

export default function TesterProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [reviewedTasks, setReviewedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);

      // Fetch project and all tasks in parallel
      const [projectRes, tasksRes] = await Promise.all([
        projectService.getProject(id),
        taskService.getProjectTasks(id)
      ]);

      setProject(projectRes.data);

      // Filter tasks by status
      const allTasks = tasksRes.data || [];
      const pending = allTasks.filter(t =>
        ['submitted', 'design_submitted', 'development_submitted'].includes(t.status)
      );
      const reviewed = allTasks.filter(t =>
        ['approved_by_tester', 'design_approved', 'development_approved', 'final_approved', 'rejected'].includes(t.status)
      );

      setPendingTasks(pending);
      setReviewedTasks(reviewed);
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTaskTypeBadge = (taskType) => {
    const config = TASK_TYPES[taskType] || { label: taskType, icon: FileText };
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
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Awaiting Review ({pendingTasks.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reviewed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Reviewed ({reviewedTasks.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <ProjectSummary projectId={id} />
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <ClipboardCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No tasks awaiting review</p>
                <p className="text-sm text-gray-400 mt-2">
                  All submitted assets have been reviewed
                </p>
              </CardBody>
            </Card>
          ) : (
            pendingTasks.map((task) => (
              <Card key={task._id} className="hover:shadow-md transition-shadow">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTaskTypeBadge(task.taskType)}
                        {getStatusBadge(task.status)}
                      </div>
                      <h3 className="font-semibold text-gray-900">{task.taskTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted by: {task.assignedTo?.name || 'Unknown'}
                      </p>

                      {/* Strategy Context Preview */}
                      {task.strategyContext && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {task.strategyContext.funnelStage && (
                              <div>
                                <span className="text-gray-500">Funnel:</span>{' '}
                                <span className="font-medium">{task.strategyContext.funnelStage}</span>
                              </div>
                            )}
                            {task.strategyContext.platform && (
                              <div>
                                <span className="text-gray-500">Platform:</span>{' '}
                                <span className="font-medium">{task.strategyContext.platform}</span>
                              </div>
                            )}
                            {task.strategyContext.hook && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Hook:</span>{' '}
                                <span className="font-medium">{task.strategyContext.hook.substring(0, 40)}...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Submitted Files */}
                      {task.outputFiles?.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-500">Files:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.outputFiles.map((file, i) => (
                              <a
                                key={i}
                                href={file.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100"
                              >
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'reviewed' && (
        <div className="space-y-4">
          {reviewedTasks.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No reviewed tasks yet</p>
              </CardBody>
            </Card>
          ) : (
            reviewedTasks.map((task) => (
              <Card key={task._id}>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTaskTypeBadge(task.taskType)}
                        {getStatusBadge(task.status)}
                      </div>
                      <h3 className="font-semibold text-gray-900">{task.taskTitle}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Reviewed by: {task.testerReviewedBy?.name || 'Unknown'}
                      </p>
                      {task.rejectionNote && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {task.rejectionNote}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/tasks/${task._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}