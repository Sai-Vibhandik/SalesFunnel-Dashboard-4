import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, Button, Spinner, Badge } from '@/components/ui';
import { taskService } from '@/services/api';
import {
  CheckCircle, Eye, FileText, Palette, Video, Layout, Code,
  ExternalLink, FileIcon, Image
} from 'lucide-react';

const TASK_TYPES = {
  graphic_design: { label: 'Graphic Design', icon: Palette },
  video_editing: { label: 'Video Editing', icon: Video },
  landing_page_design: { label: 'Landing Page Design', icon: Layout },
  landing_page_development: { label: 'Landing Page Development', icon: Code },
  content_writing: { label: 'Content Writing', icon: FileText },
};

const STATUS_LABELS = {
  approved_by_tester: { label: 'Awaiting Marketer Review', color: 'bg-blue-100 text-blue-800' },
  content_approved: { label: 'Awaiting Marketer Review', color: 'bg-blue-100 text-blue-800' },
  design_approved: { label: 'Awaiting Marketer Review', color: 'bg-blue-100 text-blue-800' },
  development_approved: { label: 'Awaiting Marketer Review', color: 'bg-blue-100 text-blue-800' },
  final_approved: { label: 'Fully Approved', color: 'bg-green-100 text-green-800' },
  content_final_approved: { label: 'Fully Approved', color: 'bg-green-100 text-green-800' },
};

export default function ApprovedAssetsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // all, approved_by_tester, final_approved

  useEffect(() => {
    fetchApprovedTasks();
  }, []);

  const fetchApprovedTasks = async () => {
    try {
      setLoading(true);
      // Fetch approved assets using the dedicated endpoint
      const res = await taskService.getApprovedAssets();
      setTasks(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load approved assets');
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status) => {
    const config = STATUS_LABELS[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'awaiting_marketer') return ['approved_by_tester', 'development_approved'].includes(task.status);
    if (filter === 'fully_approved') return task.status === 'final_approved';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved Assets</h1>
          <p className="text-gray-600 mt-1">Assets that have passed testing review</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/tasks/review')}>
            Review Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Approved</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Awaiting Marketer</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => ['approved_by_tester', 'development_approved'].includes(t.status)).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Fully Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'final_approved').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'awaiting_marketer' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('awaiting_marketer')}
            >
              Awaiting Marketer
            </Button>
            <Button
              variant={filter === 'fully_approved' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('fully_approved')}
            >
              Fully Approved
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No approved assets found</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task._id}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTaskTypeBadge(task.taskType)}
                      {getStatusBadge(task.status)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.taskTitle}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Project: {task.projectId?.projectName || task.projectId?.businessName || 'Unknown'}
                    </p>

                    {/* Strategy Context Summary */}
                    {task.strategyContext && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
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
                              <span className="font-medium">{task.strategyContext.hook.substring(0, 50)}...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Output Files */}
                    {task.outputFiles && task.outputFiles.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Deliverables</h4>
                        <div className="flex flex-wrap gap-2">
                          {task.outputFiles.map((file, index) => (
                            <a
                              key={index}
                              href={file.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded text-sm text-blue-600 hover:bg-blue-100"
                            >
                              {file.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <Image className="w-4 h-4" />
                              ) : (
                                <FileIcon className="w-4 h-4" />
                              )}
                              {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submitted Content */}
                    {task.contentOutput && (task.contentOutput.headline || task.contentOutput.bodyText) && (
                      <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                        <h4 className="text-sm font-medium text-green-800 mb-1">Submitted Content</h4>
                        {task.contentOutput.headline && (
                          <p className="text-sm font-semibold">{task.contentOutput.headline}</p>
                        )}
                        {task.contentOutput.bodyText && (
                          <p className="text-sm text-gray-600 mt-1">{task.contentOutput.bodyText}</p>
                        )}
                      </div>
                    )}

                    {/* Review Info */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      {task.testerReviewedBy && (
                        <span>
                          Tested by: {task.testerReviewedBy.name || 'Unknown'}
                        </span>
                      )}
                      {task.testerReviewedAt && (
                        <span>
                          on {new Date(task.testerReviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/tasks/${task._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    {task.status === 'final_approved' && (
                      <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 text-center">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}