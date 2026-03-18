import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, CardHeader, Button, Spinner, Badge } from '@/components/ui';
import { taskService } from '@/services/api';
import {
  ClipboardList, Play, Send, CheckCircle, XCircle, Clock,
  FileText, ExternalLink, Upload, X, FileIcon, Video, Image,
  AlertCircle, ArrowLeft, Download, Eye, Link, MessageSquare, Layout, Code, Palette
} from 'lucide-react';

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
  design_pending: { label: 'Design Pending', color: 'bg-orange-100 text-orange-800', icon: ClipboardList },
  design_submitted: { label: 'Design Review', color: 'bg-yellow-100 text-yellow-800', icon: Send },
  design_approved: { label: 'Design Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  design_rejected: { label: 'Design Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  // Landing page development workflow
  development_pending: { label: 'Dev Pending', color: 'bg-orange-100 text-orange-800', icon: ClipboardList },
  development_submitted: { label: 'Dev Review', color: 'bg-yellow-100 text-yellow-800', icon: Send },
  development_approved: { label: 'Dev Approved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
};

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  google: 'Google',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'Twitter/X',
  whatsapp: 'WhatsApp'
};

const FUNNEL_STAGE_LABELS = {
  awareness: 'Awareness',
  consideration: 'Consideration',
  conversion: 'Conversion',
  influencer_ads: 'Influencer Ads',
  retargeting: 'Retargeting',
  engagement: 'Engagement'
};

const CREATIVE_TYPE_LABELS = {
  image_creative: 'Image Creative',
  video_creative: 'Video Creative',
  carousel_creative: 'Carousel Creative',
  reel: 'Reel',
  static_ad: 'Static Ad',
  landing_page_design: 'Landing Page Design',
  landing_page_page: 'Landing Page'
};

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Submission form state - different fields for different task types
  const [submissionForm, setSubmissionForm] = useState({
    // For content creation tasks (content_writer)
    contentLink: '',
    contentFile: null,
    contentNotes: '',
    // For creative tasks (graphic_designer, video_editor)
    creativeLink: '',
    creativeFile: null,
    reviewNotes: '',
    // For landing page design (ui_ux_designer)
    designLink: '',
    designFile: null,
    designNotes: '',
    // For landing page development (developer)
    implementationUrl: '',
    repoLink: '',
    devNotes: ''
  });

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await taskService.getTask(taskId);
      setTask(res.data);
      // Initialize submission form with existing data based on task type
      if (res.data.taskType === 'content_creation') {
        setSubmissionForm({
          contentLink: res.data.contentLink || '',
          contentNotes: res.data.contentNotes || '',
          creativeLink: '',
          reviewNotes: '',
          designLink: '',
          designNotes: '',
          implementationUrl: '',
          repoLink: '',
          devNotes: ''
        });
      } else if (res.data.taskType === 'landing_page_design') {
        setSubmissionForm({
          designLink: res.data.designLink || '',
          designNotes: res.data.designNotes || '',
          contentLink: '',
          contentNotes: '',
          creativeLink: '',
          reviewNotes: '',
          implementationUrl: '',
          repoLink: '',
          devNotes: ''
        });
      } else if (res.data.taskType === 'landing_page_development') {
        setSubmissionForm({
          implementationUrl: res.data.implementationUrl || '',
          repoLink: res.data.repoLink || '',
          devNotes: res.data.devNotes || '',
          contentLink: '',
          contentNotes: '',
          creativeLink: '',
          reviewNotes: '',
          designLink: '',
          designNotes: ''
        });
      } else {
        // Graphic design, video editing, and other creative tasks
        setSubmissionForm({
          creativeLink: res.data.creativeLink || '',
          reviewNotes: res.data.reviewNotes || '',
          contentLink: '',
          contentNotes: '',
          designLink: '',
          designNotes: '',
          implementationUrl: '',
          repoLink: '',
          devNotes: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load task');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await taskService.updateTask(task._id, { status: newStatus });
      toast.success('Task status updated');
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleTesterApprove = async () => {
    try {
      await taskService.testerReview(task._id, { approved: true });
      toast.success('Task approved successfully');
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleTesterReject = async () => {
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await taskService.testerReview(task._id, {
        approved: false,
        rejectionNote: rejectionNote.trim()
      });
      toast.success('Task rejected with feedback');
      setShowRejectModal(false);
      setRejectionNote('');
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject task');
    }
  };

  const handleMarketerApprove = async () => {
    try {
      await taskService.marketerReview(task._id, { approved: true });
      toast.success('Task approved successfully');
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleMarketerReject = async () => {
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await taskService.marketerReview(task._id, {
        approved: false,
        rejectionNote: rejectionNote.trim()
      });
      toast.success('Task rejected with feedback');
      setShowRejectModal(false);
      setRejectionNote('');
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject task');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setUploading(true);

      // Build update data based on task type
      let updateData = { submittedAt: new Date() };

      // ============ CONTENT CREATION TASK ============
      if (task.taskType === 'content_creation') {
        // Validate content link
        if (!submissionForm.contentLink.trim() && selectedFiles.length === 0) {
          toast.error('Please provide a content link or upload a file');
          setUploading(false);
          return;
        }

        updateData.status = 'content_submitted';
        updateData.contentLink = submissionForm.contentLink || null;
        updateData.contentNotes = submissionForm.contentNotes || null;

        // Upload files if any
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('files', file);
          });
          const uploadRes = await taskService.uploadFiles(task._id, formData);

          // Get the uploaded file info and save to contentFile
          if (uploadRes.data.outputFiles && uploadRes.data.outputFiles.length > 0) {
            const uploadedFile = uploadRes.data.outputFiles[uploadRes.data.outputFiles.length - 1];
            updateData.contentFile = {
              name: uploadedFile.name,
              path: uploadedFile.path,
              publicId: uploadedFile.publicId,
              uploadedAt: new Date()
            };
          }
        }
      }
      // ============ LANDING PAGE DESIGN TASK ============
      else if (task.taskType === 'landing_page_design') {
        // Validate design link
        if (!submissionForm.designLink.trim() && selectedFiles.length === 0) {
          toast.error('Please provide a design link or upload a design file');
          setUploading(false);
          return;
        }

        updateData.status = 'design_submitted';
        updateData.designLink = submissionForm.designLink || null;
        updateData.designNotes = submissionForm.designNotes || null;

        // Upload files if any
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('files', file);
          });
          const uploadRes = await taskService.uploadFiles(task._id, formData);

          // Get the uploaded file info and save to designFile
          if (uploadRes.data.outputFiles && uploadRes.data.outputFiles.length > 0) {
            const uploadedFile = uploadRes.data.outputFiles[uploadRes.data.outputFiles.length - 1];
            updateData.designFile = {
              name: uploadedFile.name,
              path: uploadedFile.path,
              publicId: uploadedFile.publicId,
              uploadedAt: new Date()
            };
          }
        }
      }
      // ============ LANDING PAGE DEVELOPMENT TASK ============
      else if (task.taskType === 'landing_page_development') {
        // Validate implementation URL
        if (!submissionForm.implementationUrl.trim()) {
          toast.error('Please provide the landing page URL');
          setUploading(false);
          return;
        }

        updateData.status = 'development_submitted';
        updateData.implementationUrl = submissionForm.implementationUrl;
        updateData.repoLink = submissionForm.repoLink || null;
        updateData.devNotes = submissionForm.devNotes || null;
      }
      // ============ CREATIVE TASKS (Graphic Design, Video Editing) ============
      else {
        // Validate creative link
        if (!submissionForm.creativeLink.trim() && selectedFiles.length === 0) {
          toast.error('Please provide a creative link or upload a file');
          setUploading(false);
          return;
        }

        updateData.status = 'design_submitted';
        updateData.creativeLink = submissionForm.creativeLink || null;
        updateData.reviewNotes = submissionForm.reviewNotes || null;

        // Upload files if any
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('files', file);
          });
          await taskService.uploadFiles(task._id, formData);
        }
      }

      // Update task with submission data
      await taskService.updateTask(task._id, updateData);

      toast.success('Task submitted for review');
      setShowModal(false);
      setSelectedFiles([]);
      setSubmissionForm({
        contentLink: '',
        contentNotes: '',
        creativeLink: '',
        reviewNotes: '',
        designLink: '',
        designNotes: '',
        implementationUrl: '',
        repoLink: '',
        devNotes: ''
      });
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit task');
    } finally {
      setUploading(false);
    }
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

  const getStatusBadge = (status) => {
    const config = TASK_STATUSES[status] || TASK_STATUSES.todo;
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-1.5 ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const canStartTask = () => {
    // Standard tasks can be started from 'todo' status
    // Landing page tasks don't have an 'in_progress' status, so they can't be "started"
    return task && task.status === 'todo';
  };

  const canSubmitTask = () => {
    // Standard tasks can be submitted from 'in_progress' or 'rejected' status
    return task && ['in_progress', 'rejected'].includes(task.status);
  };

  const canSubmitContent = () => {
    // Content creator can submit from content_pending or content_rejected
    return task && ['content_pending', 'content_rejected'].includes(task.status) &&
           task.taskType === 'content_creation';
  };

  const canSubmitCreative = () => {
    // Graphic designer / Video Editor can submit from design_pending or design_rejected
    return task && ['design_pending', 'design_rejected'].includes(task.status) &&
           ['graphic_design', 'video_editing'].includes(task.taskType);
  };

  const canResubmitTask = () => {
    // For landing page tasks that have specific pending statuses after rejection
    // They can resubmit directly from design_pending or development_pending
    return task && ['design_pending', 'development_pending'].includes(task.status) &&
           (task.taskType === 'landing_page_design' || task.taskType === 'landing_page_development');
  };

  const canSubmitLandingPage = () => {
    // Landing page design/development tasks can be submitted directly from their pending states
    // Only if they haven't been rejected yet (first submission)
    return task && task.status === 'design_pending' && task.taskType === 'landing_page_design' &&
           !task.rejectionNote;
  };

  const canSubmitLandingPageDev = () => {
    return task && task.status === 'development_pending' && task.taskType === 'landing_page_development' &&
           !task.rejectionNote;
  };

  const canTesterReview = () => {
    // Testers can review tasks in these statuses
    const reviewableStatuses = ['content_submitted', 'design_submitted', 'development_submitted', 'submitted'];
    return user && (user.role === 'tester' || user.role === 'admin') &&
           task && reviewableStatuses.includes(task.status);
  };

  const canMarketerApprove = () => {
    // Performance marketers can approve tasks in these statuses
    const approvableStatuses = ['content_approved', 'design_approved', 'development_approved', 'approved_by_tester'];
    return user && (user.role === 'performance_marketer' || user.role === 'admin') &&
           task && approvableStatuses.includes(task.status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Task not found</p>
        <Button variant="secondary" onClick={() => navigate('/tasks')} className="mt-4">
          Back to Tasks
        </Button>
      </div>
    );
  }

  const strategyContext = task.strategyContext || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.taskTitle}</h1>
            <p className="text-gray-500 mt-1">
              {task.projectId?.projectName || task.projectId?.businessName || 'Unknown Project'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(task.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategy Context Card */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Strategy Context
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Creative brief provided by the Performance Marketer
              </p>
            </CardHeader>
            <CardBody className="p-6">
              <div className="space-y-6">
                {/* Funnel Stage & Creative Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Funnel Stage
                    </label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {FUNNEL_STAGE_LABELS[strategyContext.funnelStage] || strategyContext.funnelStage || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Creative Type
                    </label>
                    <p className="mt-1 text-gray-900 font-medium">
                      {CREATIVE_TYPE_LABELS[strategyContext.creativeType] || strategyContext.creativeType || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Platform */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Target Platform
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {strategyContext.platform && (
                      <Badge variant="primary" className="text-sm">
                        {PLATFORM_LABELS[strategyContext.platform] || strategyContext.platform}
                      </Badge>
                    )}
                    {strategyContext.platforms?.length > 1 && (
                      <span className="text-sm text-gray-500">
                        (Also: {strategyContext.platforms
                          .filter(p => p !== strategyContext.platform)
                          .map(p => PLATFORM_LABELS[p] || p)
                          .join(', ')})
                      </span>
                    )}
                  </div>
                </div>

                {/* Hook */}
                {strategyContext.hook && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      Hook
                    </label>
                    <p className="mt-2 text-gray-900 text-lg font-medium">
                      {strategyContext.hook}
                    </p>
                  </div>
                )}

                {/* Creative Angle / Messaging */}
                {strategyContext.creativeAngle && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <label className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                      Creative Angle
                    </label>
                    <p className="mt-2 text-gray-900">
                      {strategyContext.creativeAngle}
                    </p>
                  </div>
                )}

                {/* Messaging */}
                {strategyContext.messaging && strategyContext.messaging !== strategyContext.creativeAngle && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Messaging
                    </label>
                    <p className="mt-2 text-gray-900">
                      {strategyContext.messaging}
                    </p>
                  </div>
                )}

                {/* Headline */}
                {strategyContext.headline && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <label className="text-xs font-medium text-yellow-700 uppercase tracking-wide">
                      Headline
                    </label>
                    <p className="mt-2 text-gray-900 font-medium text-xl">
                      {strategyContext.headline}
                    </p>
                  </div>
                )}

                {/* Call to Action */}
                {strategyContext.cta && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <label className="text-xs font-medium text-green-600 uppercase tracking-wide">
                      Call to Action
                    </label>
                    <p className="mt-2 text-gray-900 font-semibold">
                      {strategyContext.cta}
                    </p>
                  </div>
                )}

                {/* Target Audience */}
                {strategyContext.targetAudience && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Target Audience
                      </label>
                      <p className="mt-2 text-gray-900">
                        {strategyContext.targetAudience}
                      </p>
                    </div>
                    {strategyContext.industry && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Industry
                        </label>
                        <p className="mt-2 text-gray-900">
                          {strategyContext.industry}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pain Points */}
                {strategyContext.painPoints?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Pain Points to Address
                    </label>
                    <ul className="mt-2 space-y-1">
                      {strategyContext.painPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-900">
                          <span className="text-red-500 mt-1">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Desires */}
                {strategyContext.desires?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Customer Desires
                    </label>
                    <ul className="mt-2 space-y-1">
                      {strategyContext.desires.map((desire, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-900">
                          <span className="text-green-500 mt-1">•</span>
                          {desire}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Offer */}
                {strategyContext.offer && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Value Proposition / Offer
                    </label>
                    <p className="mt-2 text-gray-900">
                      {strategyContext.offer}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {strategyContext.notes && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                      Additional Notes
                    </label>
                    <p className="mt-2 text-gray-900">
                      {strategyContext.notes}
                    </p>
                  </div>
                )}

                {/* Strategy Link */}
                {task.contextLink && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(task.contextLink)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Strategy
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* AI Prompt */}
          {task.aiPrompt && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Creative Brief
                </h2>
              </CardHeader>
              <CardBody className="p-6">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {task.aiPrompt}
                </pre>
              </CardBody>
            </Card>
          )}

          {/* Creative Reference - For Testers reviewing creatives */}
          {['graphic_design', 'video_editing'].includes(task.taskType) && (task.creativeLink || task.outputFiles?.length > 0 || task.reviewNotes) && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  Submitted Creative
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {task.taskType === 'video_editing' ? 'Video submitted by Video Editor' : 'Creative submitted by Graphic Designer'}
                </p>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  {/* Creative Link */}
                  {task.creativeLink && (
                    <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                      <h4 className="text-sm font-medium text-pink-800 mb-2 flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Creative Link
                      </h4>
                      <a
                        href={task.creativeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline flex items-center gap-1 text-sm break-all"
                      >
                        {task.creativeLink}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Uploaded Files */}
                  {task.outputFiles && task.outputFiles.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileIcon className="w-4 h-4" />
                        Uploaded Files ({task.outputFiles.length})
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
                            <Download className="w-4 h-4" />
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Notes */}
                  {task.reviewNotes && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes from {task.taskType === 'video_editing' ? 'Video Editor' : 'Graphic Designer'}
                      </h4>
                      <p className="text-sm text-gray-700">{task.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Content Reference - For Testers reviewing content */}
          {task.taskType === 'content_creation' && (task.contentLink || task.contentFile?.path || task.contentNotes) && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Submitted Content
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Content submitted by Content Creator
                </p>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  {/* Content Link */}
                  {task.contentLink && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
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
                    <div className="p-4 bg-gray-50 rounded-lg border">
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
                        <Download className="w-4 h-4" />
                        {task.contentFile.name || 'Download Content File'}
                      </a>
                    </div>
                  )}

                  {/* Content Notes */}
                  {task.contentNotes && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes from Content Creator
                      </h4>
                      <p className="text-sm text-gray-700">{task.contentNotes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Approved Content - For Designers/Editors working on creative tasks */}
          {/* Show content reference for graphic_design and video_editing tasks that have content, regardless of status */}
          {['graphic_design', 'video_editing'].includes(task.taskType) && (task.contentLink || task.contentFile?.path || task.contentNotes || task.contentOutput?.headline || task.contentOutput?.bodyText || task.contentOutput?.cta || task.contentOutput?.script) && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  {task.taskType === 'video_editing' ? 'Approved Script & Content Reference' : 'Approved Content Reference'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {task.taskType === 'video_editing'
                    ? 'Script and content approved by tester - use this for your video editing'
                    : 'Content approved by tester - use this for your design'}
                </p>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  {/* Content Link */}
                  {task.contentLink && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
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
                    <div className="p-4 bg-gray-50 rounded-lg border">
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
                        <Download className="w-4 h-4" />
                        {task.contentFile.name || 'Download Content File'}
                      </a>
                    </div>
                  )}

                  {/* Content Notes */}
                  {task.contentNotes && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes from Content Creator
                      </h4>
                      <p className="text-sm text-gray-700">{task.contentNotes}</p>
                    </div>
                  )}

                  {/* Content Output (headline, bodyText, cta, script) */}
                  {task.contentOutput && (task.contentOutput.headline || task.contentOutput.bodyText || task.contentOutput.cta || task.contentOutput.script) && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                </div>
              </CardBody>
            </Card>
          )}

          {/* Submitted Design - For Testers reviewing landing page design */}
          {task.taskType === 'landing_page_design' && ['design_submitted', 'design_approved', 'design_rejected'].includes(task.status) && (task.designLink || task.designFile?.path || task.designNotes) && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-600" />
                  Submitted Design
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Design submitted by UI/UX Designer for review
                </p>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  {/* Design Link */}
                  {task.designLink && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Design Link
                      </h4>
                      <a
                        href={task.designLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline flex items-center gap-1 text-sm break-all"
                      >
                        {task.designLink}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Design File */}
                  {task.designFile?.path && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileIcon className="w-4 h-4" />
                        Design File
                      </h4>
                      <a
                        href={task.designFile.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border rounded text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-1 w-fit"
                      >
                        <Download className="w-4 h-4" />
                        {task.designFile.name || 'Download Design File'}
                      </a>
                    </div>
                  )}

                  {/* Designer Notes */}
                  {task.designNotes && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes from Designer
                      </h4>
                      <p className="text-sm text-gray-700">{task.designNotes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Design Reference - For Developers */}
          {task.taskType === 'landing_page_development' && (task.designLink || task.designFile?.path || task.designNotes) && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-600" />
                  Design Reference
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Design assets from UI/UX Designer
                </p>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  {/* Design Link */}
                  {task.designLink && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Design Link
                      </h4>
                      <a
                        href={task.designLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm break-all"
                      >
                        {task.designLink}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Design File */}
                  {task.designFile?.path && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileIcon className="w-4 h-4" />
                        Design File
                      </h4>
                      <a
                        href={task.designFile.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border rounded text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-1 w-fit"
                      >
                        <Download className="w-4 h-4" />
                        {task.designFile.name || 'Download Design File'}
                      </a>
                    </div>
                  )}

                  {/* Designer Notes */}
                  {task.designNotes && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes from Designer
                      </h4>
                      <p className="text-sm text-gray-700">{task.designNotes}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Previously Submitted Work */}
          {task.outputFiles?.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  Submitted Files
                </h2>
              </CardHeader>
              <CardBody className="p-6">
                <div className="flex flex-wrap gap-3">
                  {task.outputFiles.map((file, index) => (
                    <a
                      key={index}
                      href={file.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {file.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <Image className="w-4 h-4" />
                      ) : file.path?.match(/\.(mp4|mov|avi|webm)$/i) ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <FileIcon className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                    </a>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Rejection Note */}
          {task.status === 'rejected' && task.rejectionNote && (
            <Card className="border-red-200">
              <CardBody className="p-6 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Rejection Feedback</h3>
                    <p className="mt-1 text-red-700">{task.rejectionNote}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardBody className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Task Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Task Type</dt>
                  <dd className="mt-1 text-gray-900">
                    {task.taskType?.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Asset Type</dt>
                  <dd className="mt-1 text-gray-900">
                    {CREATIVE_TYPE_LABELS[task.assetType] || task.assetType?.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Priority</dt>
                  <dd className="mt-1">
                    <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'urgent' ? 'danger' : 'default'}>
                      {task.priority}
                    </Badge>
                  </dd>
                </div>
                {task.dueDate && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Due Date</dt>
                    <dd className="mt-1 text-gray-900 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Assigned Role</dt>
                  <dd className="mt-1 text-gray-900">
                    {task.assignedRole?.replace(/_/g, ' ')}
                  </dd>
                </div>
                {task.assignedTo && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Assigned To</dt>
                    <dd className="mt-1 text-gray-900">
                      {task.assignedTo?.name || 'Unassigned'}
                    </dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card>
            <CardBody className="p-6 space-y-3">
              {canStartTask() && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate('in_progress')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Task
                </Button>
              )}
              {/* Content Creator Submit Button */}
              {canSubmitContent() && (
                <Button
                  className="w-full"
                  onClick={() => setShowModal(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Content
                </Button>
              )}
              {/* Creative/Grammar Designer Submit Button */}
              {canSubmitCreative() && (
                <Button
                  className="w-full"
                  onClick={() => setShowModal(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Creative
                </Button>
              )}
              {/* Landing Page Design/Development Submit Button */}
              {(canSubmitTask() || canResubmitTask() || canSubmitLandingPage() || canSubmitLandingPageDev()) && (
                <Button
                  className="w-full"
                  onClick={() => setShowModal(true)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {canResubmitTask() ? 'Resubmit for Review' : 'Submit for Review'}
                </Button>
              )}

              {/* Tester Review Actions */}
              {canTesterReview() && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="font-medium text-gray-900">Tester Review</h4>
                  <p className="text-sm text-gray-500">
                    Review the submitted work and approve or reject.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="success"
                      onClick={handleTesterApprove}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      className="flex-1"
                      variant="danger"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Marketer Approval Actions */}
              {canMarketerApprove() && (
                <div className="space-y-3 pt-3 border-t">
                  <h4 className="font-medium text-gray-900">Marketer Review</h4>
                  <p className="text-sm text-gray-500">
                    Final approval required before task completion.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="success"
                      onClick={handleMarketerApprove}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      className="flex-1"
                      variant="danger"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {task.status === 'content_submitted' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                  Content is pending tester review
                </div>
              )}
              {task.status === 'content_approved' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  Content approved, awaiting marketer review
                </div>
              )}
              {task.status === 'content_rejected' && task.rejectionNote && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Content rejected. Please revise and resubmit.
                  </p>
                </div>
              )}
              {task.status === 'submitted' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                  Task is pending tester review
                </div>
              )}
              {task.status === 'design_submitted' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                  Design is pending tester review
                </div>
              )}
              {task.status === 'development_submitted' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <Eye className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                  Development is pending tester review
                </div>
              )}
              {task.status === 'design_approved' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  Design approved, awaiting development
                </div>
              )}
              {task.status === 'development_approved' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  Development approved, awaiting marketer review
                </div>
              )}
              {task.status === 'approved_by_tester' && (
                <div className="text-center text-sm text-gray-500 py-4">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                  Awaiting marketer approval
                </div>
              )}
              {task.status === 'final_approved' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium text-green-700">Task Completed</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* SOP Reference */}
          {task.sopReference && (
            <Card>
              <CardBody className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">SOP Reference</h3>
                <a
                  href={task.sopReference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  View Standard Operating Procedure
                </a>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {task.taskType === 'content_creation' ? 'Submit Content for Review' :
                 task.taskType === 'landing_page_design' ? 'Submit Design for Review' :
                 task.taskType === 'landing_page_development' ? 'Submit Implementation for Review' :
                 task.taskType === 'graphic_design' ? 'Submit Creative for Review' :
                 task.taskType === 'video_editing' ? 'Submit Video for Review' :
                 'Submit Work for Review'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* ============ CONTENT CREATION (Content Creator) ============ */}
              {task.taskType === 'content_creation' && (
                <>
                  {/* Content Link - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={submissionForm.contentLink}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, contentLink: e.target.value })}
                        placeholder="https://docs.google.com/... or https://drive.google.com/..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Share a link to your content (Google Docs, Drive, Figma, etc.)
                    </p>
                  </div>

                  {/* Content File Upload - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Content File <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="content-file-upload"
                    />
                    <label
                      htmlFor="content-file-upload"
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors text-center cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload content files</p>
                      <p className="text-xs text-gray-400 mt-1">Documents, Images, Videos (Max 100MB)</p>
                    </label>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveFile(index)} className="p-1 hover:bg-gray-200 rounded">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Notes
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={submissionForm.contentNotes}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, contentNotes: e.target.value })}
                        placeholder="Add notes about your content for the tester..."
                        rows={4}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ============ LANDING PAGE DESIGN (UI/UX Designer) ============ */}
              {task.taskType === 'landing_page_design' && (
                <>
                  {/* Design Link - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Design Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={submissionForm.designLink}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, designLink: e.target.value })}
                        placeholder="https://figma.com/file/... or https://drive.google.com/..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Share a link to your design file (Figma, Adobe XD, Drive, etc.)
                    </p>
                  </div>

                  {/* Design File Upload - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Design File <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,.pdf,.psd,.ai,.sketch,.fig,.zip"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="design-file-upload"
                    />
                    <label
                      htmlFor="design-file-upload"
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors text-center cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload design files</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, PSD, AI, Sketch, Images (Max 100MB)</p>
                    </label>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveFile(index)} className="p-1 hover:bg-gray-200 rounded">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes for Developer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for Developer
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={submissionForm.designNotes}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, designNotes: e.target.value })}
                        placeholder="Add notes for the developer implementing this design..."
                        rows={4}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ============ LANDING PAGE DEVELOPMENT (Developer) ============ */}
              {task.taskType === 'landing_page_development' && (
                <>
                  {/* Show Design Reference if available */}
                  {task.designLink && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Design Reference from UI/UX Designer
                      </h4>
                      <a
                        href={task.designLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm break-all"
                      >
                        {task.designLink}
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      </a>
                      {task.designNotes && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-blue-700 font-medium">Designer Notes:</p>
                          <p className="text-sm text-gray-700 mt-1">{task.designNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {task.designFile?.path && (
                    <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileIcon className="w-4 h-4" />
                        Design File
                      </h4>
                      <a
                        href={task.designFile.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border rounded text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-1 w-fit"
                      >
                        <Download className="w-4 h-4" />
                        {task.designFile.name || 'Download Design File'}
                      </a>
                    </div>
                  )}

                  {/* Implementation URL - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landing Page URL <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={submissionForm.implementationUrl}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, implementationUrl: e.target.value })}
                        placeholder="https://your-landing-page.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      The URL where the landing page is deployed
                    </p>
                  </div>

                  {/* Repository Link - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository Link <span className="text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={submissionForm.repoLink}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, repoLink: e.target.value })}
                        placeholder="https://github.com/username/repo"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes for Tester */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for Tester
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={submissionForm.devNotes}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, devNotes: e.target.value })}
                        placeholder="Add notes for the tester reviewing this implementation..."
                        rows={4}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ============ OTHER CREATIVE TASKS (Graphic Designer, etc.) ============ */}
              {task.taskType !== 'landing_page_design' && task.taskType !== 'landing_page_development' && (
                <>
                  {/* Creative Link - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Creative Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={submissionForm.creativeLink}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, creativeLink: e.target.value })}
                        placeholder="https://figma.com/file/... or https://canva.com/..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Share a link to your design (Figma, Canva, Google Drive, etc.)
                    </p>
                  </div>

                  {/* File Upload - Optional */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload File <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*,video/*,.pdf,.psd,.ai,.sketch,.zip"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload-modal"
                    />
                    <label
                      htmlFor="file-upload-modal"
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors text-center cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload files</p>
                      <p className="text-xs text-gray-400 mt-1">Images, Videos, PDFs, PSDs (Max 100MB)</p>
                    </label>

                    {selectedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveFile(index)} className="p-1 hover:bg-gray-200 rounded">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes for Reviewer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for Reviewer
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={submissionForm.reviewNotes}
                        onChange={(e) => setSubmissionForm({ ...submissionForm, reviewNotes: e.target.value })}
                        placeholder="Add any notes or context for the reviewer..."
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleSubmitForReview} loading={uploading} disabled={uploading}>
                <Send className="w-4 h-4 mr-1" />
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Task</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this task. This feedback will be shared with the assigned team member.
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => {
                setShowRejectModal(false);
                setRejectionNote('');
              }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={canTesterReview() ? handleTesterReject : handleMarketerReject}>
                <XCircle className="w-4 h-4 mr-1" />
                Reject Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}