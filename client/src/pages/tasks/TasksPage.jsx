import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Input, Textarea, Spinner, Badge } from '@/components/ui';
import { taskService, projectService } from '@/services/api';
import {
  ClipboardList, FileText, Palette, Clock, CheckCircle, XCircle, Play,
  Upload, Send, Eye, ArrowRight, AlertCircle, Video, Layout, Code, X, FileIcon,
  ArrowLeft
} from 'lucide-react';

// Task statuses for the production workflow
const TASK_STATUSES = {
  // Common statuses
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800', icon: ClipboardList },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Play },
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', icon: Send },
  approved_by_tester: { label: 'Tester Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  final_approved: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  // Content creation workflow
  content_pending: { label: 'Content Pending', color: 'bg-orange-100 text-orange-800', icon: FileText },
  content_submitted: { label: 'Content Review', color: 'bg-yellow-100 text-yellow-800', icon: Send },
  content_approved: { label: 'Content Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  content_rejected: { label: 'Content Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  content_final_approved: { label: 'Content Final Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  // Design workflow
  design_pending: { label: 'Design Pending', color: 'bg-orange-100 text-orange-800', icon: Layout },
  design_submitted: { label: 'Design Review', color: 'bg-yellow-100 text-yellow-800', icon: Send },
  design_approved: { label: 'Design Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  design_rejected: { label: 'Design Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  // Landing page development workflow
  development_pending: { label: 'Dev Pending', color: 'bg-orange-100 text-orange-800', icon: Code },
  development_submitted: { label: 'Dev Review', color: 'bg-yellow-100 text-yellow-800', icon: Send },
  development_approved: { label: 'Dev Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
};

const TASK_TYPES = [
  { id: 'graphic_design', label: 'Graphic Design', icon: Palette },
  { id: 'video_editing', label: 'Video Editing', icon: Video },
  { id: 'landing_page_design', label: 'Landing Page Design', icon: Layout },
  { id: 'landing_page_development', label: 'Landing Page Development', icon: Code },
  { id: 'content_writing', label: 'Content Writing', icon: FileText },
];

const ASSET_TYPES = [
  { id: 'image_creative', label: 'Image Creative' },
  { id: 'video_creative', label: 'Video Creative' },
  { id: 'carousel_creative', label: 'Carousel Creative' },
  { id: 'reel', label: 'Reel' },
  { id: 'static_ad', label: 'Static Ad' },
  { id: 'landing_page_design', label: 'Landing Page Design' },
  { id: 'landing_page_page', label: 'Landing Page' },
];

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [filter, setFilter] = useState({ status: '', taskType: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [contentForm, setContentForm] = useState({
    headline: '',
    bodyText: '',
    cta: '',
    script: '',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    // Fetch project details if projectId is provided
    if (projectId) {
      fetchProject();
    }
    fetchTasks();
  }, [filter, projectId]);

  const fetchProject = async () => {
    try {
      const res = await projectService.getProject(projectId);
      setProject(res.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.taskType) params.taskType = filter.taskType;

      // If projectId is specified, get tasks for that project
      // Otherwise get tasks for the current user (by role)
      let res;
      if (projectId) {
        res = await taskService.getProjectTasks(projectId, params);
      } else {
        // Get tasks from the Task collection (created by generateTasksFromStrategy)
        // This is the primary source for all team member tasks
        res = taskService.getMyRoleTasks
          ? await taskService.getMyRoleTasks(params)
          : await taskService.getMyTasks(params);
      }
      setTasks(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus, additionalData = {}) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus, ...additionalData });
      toast.success('Task status updated');
      fetchTasks();
      setShowModal(false);
      setSelectedTask(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleSubmitForReview = async (task) => {
    try {
      setUploading(true);
      let status;
      if (task.taskType === 'landing_page_design') {
        status = 'design_submitted';
      } else if (task.taskType === 'landing_page_development') {
        status = 'development_submitted';
      } else {
        status = 'submitted';
      }

      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        await taskService.uploadFiles(task._id, formData);
      }

      // Update task content and status
      await taskService.updateTask(task._id, {
        status,
        contentOutput: contentForm
      });

      toast.success('Task submitted for review');
      fetchTasks();
      setShowModal(false);
      setSelectedTask(null);
      setContentForm({ headline: '', bodyText: '', cta: '', script: '', notes: '' });
      setSelectedFiles([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit task');
    } finally {
      setUploading(false);
    }
  };

  const handleContentSubmit = async (taskId) => {
    try {
      await taskService.updateTaskContent(taskId, contentForm);
      await taskService.updateTask(taskId, { status: 'submitted' });
      toast.success('Content submitted successfully');
      setShowModal(false);
      setSelectedTask(null);
      setContentForm({ headline: '', bodyText: '', cta: '', script: '', notes: '' });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit content');
    }
  };

  const openContentModal = (task) => {
    setSelectedTask(task);
    setContentForm({
      headline: task.contentOutput?.headline || '',
      bodyText: task.contentOutput?.bodyText || '',
      cta: task.contentOutput?.cta || '',
      script: task.contentOutput?.script || '',
      notes: task.contentOutput?.notes || ''
    });
    setSelectedFiles([]);
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return null;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = TASK_STATUSES[status] || TASK_STATUSES.todo;
    const Icon = statusConfig.icon;
    return (
      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const getTaskTypeBadge = (taskType) => {
    const typeConfig = TASK_TYPES.find(t => t.id === taskType);
    const Icon = typeConfig?.icon || ClipboardList;
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {typeConfig?.label || taskType}
      </span>
    );
  };

  const canStartTask = (task) => {
    return task.status === 'todo' || task.status === 'design_pending' || task.status === 'development_pending';
  };

  const canSubmitTask = (task) => {
    return task.status === 'in_progress' || task.status === 'rejected';
  };

  const canResubmitTask = (task) => {
    return task.status === 'rejected';
  };

  const getSubmitStatus = (task) => {
    if (task.taskType === 'landing_page_design') return 'design_submitted';
    if (task.taskType === 'landing_page_development') return 'development_submitted';
    return 'submitted';
  };

  if (loading && tasks.length === 0) {
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
        <div className="flex items-center gap-4">
          {projectId && (
            <Button
              variant="ghost"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {projectId ? 'Project Tasks' : 'My Tasks'}
            </h1>
            {projectId && project ? (
              <p className="text-gray-600 mt-1">
                Tasks for: <span className="font-medium">{project.projectName || project.businessName}</span>
              </p>
            ) : (
              <p className="text-gray-600 mt-1">View and manage your assigned tasks</p>
            )}
          </div>
        </div>
        {projectId && (
          <Badge variant="success" className="text-sm">
            Strategy Completed
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                {Object.entries(TASK_STATUSES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                value={filter.taskType}
                onChange={(e) => setFilter({ ...filter, taskType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                {TASK_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            {projectId && project ? (
              <>
                <p className="text-gray-500 mb-2">No tasks have been generated for this project yet.</p>
                <p className="text-sm text-gray-400">
                  Tasks will appear here after the strategy is completed.
                </p>
              </>
            ) : (
              <p className="text-gray-500">No tasks assigned to you</p>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <Card key={task._id}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTaskTypeBadge(task.taskType)}
                      {getStatusBadge(task.status)}
                      {task.assetType && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {ASSET_TYPES.find(a => a.id === task.assetType)?.label || task.assetType}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.taskTitle}</h3>
                    {task.description && (
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>Project: {task.projectId?.projectName || task.projectId?.businessName || 'Unknown'}</span>
                      {task.adTypeKey && (
                        <span>Ad Type: {task.adTypeKey}</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="mt-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}

                    {/* AI Prompt Preview */}
                    {task.aiPrompt && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">AI Creative Brief</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{task.aiPrompt.substring(0, 200)}...</p>
                      </div>
                    )}

                    {/* Content Output Preview */}
                    {task.contentOutput && (task.contentOutput.headline || task.contentOutput.bodyText) && (
                      <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Submitted Content</h4>
                        {task.contentOutput.headline && (
                          <p className="text-sm font-semibold">{task.contentOutput.headline}</p>
                        )}
                        {task.contentOutput.bodyText && (
                          <p className="text-sm text-gray-600 mt-1">{task.contentOutput.bodyText}</p>
                        )}
                      </div>
                    )}

                    {/* Rejection Note */}
                    {task.status === 'rejected' && task.rejectionNote && (
                      <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                        <h4 className="text-sm font-medium text-red-800 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Rejection Feedback
                        </h4>
                        <p className="text-sm text-red-700">{task.rejectionNote}</p>
                      </div>
                    )}

                    {/* Output Files */}
                    {task.outputFiles && task.outputFiles.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files</h4>
                        <div className="flex flex-wrap gap-2">
                          {task.outputFiles.map((file, index) => (
                            <a
                              key={index}
                              href={file.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-gray-100 rounded text-sm text-blue-600 hover:bg-gray-200"
                            >
                              {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/tasks/${task._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {canStartTask(task) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => openContentModal(task)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Submit for Review
                      </Button>
                    )}
                    {task.status === 'rejected' && (
                      <Button
                        size="sm"
                        onClick={() => openContentModal(task)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Resubmit
                      </Button>
                    )}
                    {task.status === 'final_approved' && (
                      <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Content Submission Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedTask.status === 'rejected' ? 'Resubmit Task' : 'Submit for Review'}
            </h2>
            <p className="text-gray-600 mb-4">{selectedTask.taskTitle}</p>

            {/* AI Prompt */}
            {selectedTask.aiPrompt && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-1">AI Creative Brief</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedTask.aiPrompt}</p>
              </div>
            )}

            {/* SOP Reference */}
            {selectedTask.sopReference && (
              <div className="mb-4">
                <a
                  href={selectedTask.sopReference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Standard Operating Procedure (SOP)
                </a>
              </div>
            )}

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Deliverables (Images, Videos, Documents)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.psd,.ai,.sketch,.fig,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-center"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Images, Videos, PDFs, PSDs, AI files (Max 100MB each)
                  </p>
                </button>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {getFileIcon(file)}
                          <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing uploaded files */}
                {selectedTask.outputFiles && selectedTask.outputFiles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Previously Uploaded:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.outputFiles.map((file, index) => (
                        <a
                          key={index}
                          href={file.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-50 rounded text-sm text-blue-600 hover:bg-blue-100"
                        >
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <Input
                  value={contentForm.headline}
                  onChange={(e) => setContentForm({ ...contentForm, headline: e.target.value })}
                  placeholder="Enter headline..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Text / Description</label>
                <Textarea
                  value={contentForm.bodyText}
                  onChange={(e) => setContentForm({ ...contentForm, bodyText: e.target.value })}
                  placeholder="Enter body text or description..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action</label>
                <Input
                  value={contentForm.cta}
                  onChange={(e) => setContentForm({ ...contentForm, cta: e.target.value })}
                  placeholder="Enter CTA..."
                />
              </div>
              {selectedTask.taskType === 'video_editing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                  <Textarea
                    value={contentForm.script}
                    onChange={(e) => setContentForm({ ...contentForm, script: e.target.value })}
                    placeholder="Enter video script..."
                    rows={4}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Textarea
                  value={contentForm.notes}
                  onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })}
                  placeholder="Additional notes for reviewer..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={() => handleSubmitForReview(selectedTask)} loading={uploading} disabled={uploading}>
                <Send className="w-4 h-4 mr-1" />
                {uploading ? 'Uploading...' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}