import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, Button, Spinner, Textarea, Badge } from '@/components/ui';
import { taskService } from '@/services/api';
import {
  Clock, CheckCircle, XCircle, Eye, FileText, Palette, Video, Layout, Code,
  AlertCircle, ExternalLink, User, Link, MessageSquare, FileIcon, Download
} from 'lucide-react';

const TASK_TYPES = {
  graphic_design: { label: 'Graphic Design', icon: Palette },
  video_editing: { label: 'Video Editing', icon: Video },
  landing_page_design: { label: 'Landing Page Design', icon: Layout },
  landing_page_development: { label: 'Landing Page Development', icon: Code },
  content_writing: { label: 'Content Writing', icon: FileText },
};

const STATUS_LABELS = {
  approved_by_tester: 'Tester Approved - Pending Your Review',
  development_approved: 'Development Approved - Pending Your Review',
};

export default function MarketerApprovalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const fetchPendingTasks = async () => {
    try {
      setLoading(true);
      const res = await taskService.getPendingMarketerApproval();
      setTasks(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pending tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (task) => {
    try {
      await taskService.marketerReview(task._id, { approved: true });
      toast.success('Task fully approved and ready for deployment!');
      fetchPendingTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    try {
      await taskService.marketerReview(selectedTask._id, {
        approved: false,
        rejectionNote
      });
      toast.success('Task rejected with feedback');
      setShowRejectionModal(false);
      setSelectedTask(null);
      setRejectionNote('');
      fetchPendingTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject task');
    }
  };

  const openRejectionModal = (task) => {
    setSelectedTask(task);
    setRejectionNote('');
    setShowRejectionModal(true);
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
    const label = STATUS_LABELS[status] || status;
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        {label}
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approval</h1>
          <p className="text-gray-600 mt-1">Final review and approval of creative assets</p>
        </div>
        <Badge variant="secondary">{tasks.length} pending</Badge>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500">No tasks pending approval</p>
            <p className="text-sm text-gray-400 mt-2">All creative assets have been reviewed</p>
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
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.taskTitle}</h3>

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>Project: {task.projectId?.projectName || task.projectId?.businessName || 'Unknown'}</span>
                    </div>

                    {/* Tester Info */}
                    {task.testerReviewedBy && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>Approved by: {task.testerReviewedBy.name || 'Tester'}</span>
                        <span className="text-gray-400">at {new Date(task.testerReviewedAt).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Creative Link - PRIMARY */}
                    {task.creativeLink && (
                      <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          Creative Link
                        </h4>
                        <a
                          href={task.creativeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm break-all"
                        >
                          {task.creativeLink}
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Uploaded Files */}
                    {task.outputFiles && task.outputFiles.length > 0 && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FileIcon className="w-4 h-4" />
                          Uploaded Files
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {task.outputFiles.map((file, index) => (
                            <a
                              key={index}
                              href={file.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border rounded text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Designer Notes */}
                    {task.reviewNotes && (
                      <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Notes from Designer
                        </h4>
                        <p className="text-sm text-gray-700">{task.reviewNotes}</p>
                      </div>
                    )}

                    {/* ============ CONTENT CREATION SUBMISSION ============ */}
                    {task.taskType === 'content_creation' && (
                      <>
                        {/* Content Link */}
                        {task.contentLink && (
                          <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                              <Link className="w-4 h-4" />
                              Content Link
                            </h4>
                            <a
                              href={task.contentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline flex items-center gap-1 text-sm break-all"
                            >
                              {task.contentLink}
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            </a>
                          </div>
                        )}

                        {/* Content File */}
                        {task.contentFile?.path && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <FileIcon className="w-4 h-4" />
                              Content File
                            </h4>
                            <a
                              href={task.contentFile.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-white border rounded text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-1 w-fit"
                            >
                              <Download className="w-3 h-3" />
                              {task.contentFile.name || 'Download Content File'}
                            </a>
                          </div>
                        )}

                        {/* Content Notes */}
                        {task.contentNotes && (
                          <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Notes from Content Creator
                            </h4>
                            <p className="text-sm text-gray-700">{task.contentNotes}</p>
                          </div>
                        )}

                        {/* Content Output (legacy field) */}
                        {(task.contentOutput?.headline || task.contentOutput?.bodyText || task.contentOutput?.cta || task.contentOutput?.script) && (
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-800 mb-3">Content Output</h4>
                            {task.contentOutput.headline && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-blue-600">Headline:</span>
                                <p className="text-sm text-gray-800">{task.contentOutput.headline}</p>
                              </div>
                            )}
                            {task.contentOutput.bodyText && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-blue-600">Body Text:</span>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{task.contentOutput.bodyText}</p>
                              </div>
                            )}
                            {task.contentOutput.cta && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-blue-600">CTA:</span>
                                <p className="text-sm text-gray-800">{task.contentOutput.cta}</p>
                              </div>
                            )}
                            {task.contentOutput.script && (
                              <div>
                                <span className="text-xs font-medium text-blue-600">Script:</span>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{task.contentOutput.script}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* ============ LANDING PAGE DEVELOPMENT SPECIFIC ============ */}
                    {task.taskType === 'landing_page_development' && (
                      <>
                        {/* Implementation URL */}
                        {task.implementationUrl && (
                          <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                              <Link className="w-4 h-4" />
                              Landing Page URL
                            </h4>
                            <a
                              href={task.implementationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline flex items-center gap-1 text-sm break-all"
                            >
                              {task.implementationUrl}
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            </a>
                          </div>
                        )}

                        {/* Repository Link */}
                        {task.repoLink && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              Repository Link
                            </h4>
                            <a
                              href={task.repoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 text-sm break-all"
                            >
                              {task.repoLink}
                              <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            </a>
                          </div>
                        )}

                        {/* Developer Notes */}
                        {task.devNotes && (
                          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Notes from Developer
                            </h4>
                            <p className="text-sm text-gray-700">{task.devNotes}</p>
                          </div>
                        )}

                        {/* Design Reference */}
                        {(task.designLink || task.designFile?.path) && (
                          <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                              <Layout className="w-4 h-4" />
                              Original Design Reference
                            </h4>
                            {task.designLink && (
                              <a
                                href={task.designLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline flex items-center gap-1 text-sm break-all"
                              >
                                <Link className="w-3 h-3" />
                                {task.designLink}
                              </a>
                            )}
                            {task.designFile?.path && (
                              <a
                                href={task.designFile.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 px-3 py-1.5 bg-white border rounded text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-1 w-fit"
                              >
                                <Download className="w-3 h-3" />
                                {task.designFile.name || 'Design File'}
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* AI Prompt Preview */}
                    {task.aiPrompt && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Creative Brief</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{task.aiPrompt.substring(0, 150)}...</p>
                      </div>
                    )}

                    {/* Strategy Context */}
                    {task.strategyContext && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Strategy Context</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {task.strategyContext.industry && (
                            <div><span className="font-medium">Industry:</span> {task.strategyContext.industry}</div>
                          )}
                          {task.strategyContext.targetAudience && (
                            <div><span className="font-medium">Audience:</span> {task.strategyContext.targetAudience}</div>
                          )}
                          {task.strategyContext.offer && (
                            <div className="col-span-2"><span className="font-medium">Offer:</span> {task.strategyContext.offer}</div>
                          )}
                          {task.strategyContext.hook && (
                            <div className="col-span-2"><span className="font-medium">Hook:</span> {task.strategyContext.hook}</div>
                          )}
                          {task.strategyContext.headline && (
                            <div><span className="font-medium">Headline:</span> {task.strategyContext.headline}</div>
                          )}
                          {task.strategyContext.cta && (
                            <div><span className="font-medium">CTA:</span> {task.strategyContext.cta}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Content Output - Legacy */}
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

                    {/* Assigned To */}
                    <div className="mt-3 text-sm text-gray-500">
                      <span>Created by: {task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(task)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Final Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openRejectionModal(task)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/projects/${task.projectId?._id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Project
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Reject Task</h2>
            <p className="text-gray-600 mb-4">{selectedTask.taskTitle}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback for Revision
                </label>
                <Textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Provide specific feedback for improvement..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowRejectionModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}