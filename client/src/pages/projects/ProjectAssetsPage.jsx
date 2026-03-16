import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, CardHeader, Button, Spinner, Badge } from '@/components/ui';
import { taskService } from '@/services/api';
import {
  ArrowLeft, Image, Video, FileText, Layout, Code,
  ExternalLink, Download, FileIcon, Link, CheckCircle,
  Palette, Film, FileCheck
} from 'lucide-react';

const TASK_TYPE_CONFIG = {
  graphic_design: { label: 'Graphic Design', icon: Palette, color: 'bg-pink-100 text-pink-800' },
  video_editing: { label: 'Video Editing', icon: Film, color: 'bg-indigo-100 text-indigo-800' },
  content_creation: { label: 'Content Creation', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  landing_page_design: { label: 'Landing Page Design', icon: Layout, color: 'bg-purple-100 text-purple-800' },
  landing_page_development: { label: 'Landing Page Development', icon: Code, color: 'bg-green-100 text-green-800' },
};

const STATUS_CONFIG = {
  approved_by_tester: { label: 'Tester Approved', color: 'bg-purple-100 text-purple-800' },
  content_approved: { label: 'Content Approved', color: 'bg-purple-100 text-purple-800' },
  design_approved: { label: 'Design Approved', color: 'bg-purple-100 text-purple-800' },
  development_approved: { label: 'Dev Approved', color: 'bg-purple-100 text-purple-800' },
  final_approved: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  content_final_approved: { label: 'Content Final', color: 'bg-green-100 text-green-800' },
};

export default function ProjectAssetsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({
    creatives: [],
    landingPages: [],
    content: [],
    other: []
  });
  const [activeTab, setActiveTab] = useState('creatives');

  useEffect(() => {
    fetchCompletedAssets();
  }, [projectId]);

  const fetchCompletedAssets = async () => {
    try {
      setLoading(true);
      const res = await taskService.getProjectCompletedAssets(projectId);
      setProject(res.data.project);
      setTasks(res.data.tasks);
      setGroupedTasks(res.data.groupedTasks);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load completed assets');
      console.error('Error fetching completed assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeBadge = (taskType) => {
    const config = TASK_TYPE_CONFIG[taskType] || { label: taskType, icon: FileText, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderAssetCard = (task) => (
    <Card key={task._id} className="overflow-hidden">
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getTaskTypeBadge(task.taskType)}
              {getStatusBadge(task.status)}
            </div>
            <h4 className="font-medium text-gray-900">{task.taskTitle}</h4>
            {task.assetType && (
              <p className="text-sm text-gray-500 mt-1">
                Asset: {task.assetType?.replace(/_/g, ' ')}
              </p>
            )}
          </div>
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        </div>

        {/* Strategy Context */}
        {task.strategyContext && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
            {task.strategyContext.hook && (
              <p className="text-gray-600"><span className="font-medium">Hook:</span> {task.strategyContext.hook}</p>
            )}
            {task.strategyContext.platform && (
              <p className="text-gray-600"><span className="font-medium">Platform:</span> {task.strategyContext.platform}</p>
            )}
          </div>
        )}

        {/* Submitted Links and Files */}
        <div className="space-y-2">
          {/* Design Link */}
          {task.designLink && (
            <a
              href={task.designLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm text-blue-600 hover:bg-blue-100"
            >
              <Link className="w-4 h-4" />
              <span className="truncate">{task.designLink}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          )}

          {/* Design File */}
          {task.designFile?.path && (
            <a
              href={task.designFile.path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm text-gray-700 hover:bg-gray-100"
            >
              <FileIcon className="w-4 h-4" />
              <span>{task.designFile.name || 'Download Design File'}</span>
              <Download className="w-4 h-4 ml-auto" />
            </a>
          )}

          {/* Creative Link */}
          {task.creativeLink && (
            <a
              href={task.creativeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm text-blue-600 hover:bg-blue-100"
            >
              <Link className="w-4 h-4" />
              <span className="truncate">{task.creativeLink}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          )}

          {/* Implementation URL */}
          {task.implementationUrl && (
            <a
              href={task.implementationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm text-green-600 hover:bg-green-100"
            >
              <Link className="w-4 h-4" />
              <span className="truncate">{task.implementationUrl}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          )}

          {/* Output Files */}
          {task.outputFiles && task.outputFiles.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Uploaded Files:</p>
              {task.outputFiles.map((file, idx) => (
                <a
                  key={idx}
                  href={file.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm text-gray-700 hover:bg-gray-100"
                >
                  {file.path?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <Image className="w-4 h-4" />
                  ) : file.path?.match(/\.(mp4|mov|avi|webm)$/i) ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <FileIcon className="w-4 h-4" />
                  )}
                  <span className="truncate">{file.name}</span>
                  <Download className="w-4 h-4 ml-auto" />
                </a>
              ))}
            </div>
          )}

          {/* Content Output */}
          {task.contentOutput && (task.contentOutput.headline || task.contentOutput.bodyText) && (
            <div className="p-3 bg-blue-50 rounded text-sm">
              {task.contentOutput.headline && (
                <p className="font-medium text-gray-900">{task.contentOutput.headline}</p>
              )}
              {task.contentOutput.bodyText && (
                <p className="text-gray-600 mt-1">{task.contentOutput.bodyText}</p>
              )}
            </div>
          )}

          {/* Notes */}
          {(task.designNotes || task.reviewNotes || task.devNotes) && (
            <div className="p-2 bg-yellow-50 rounded text-sm text-gray-600">
              <p className="font-medium text-yellow-800 mb-1">Notes:</p>
              <p>{task.designNotes || task.reviewNotes || task.devNotes}</p>
            </div>
          )}
        </div>

        {/* Review Info */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {task.testerReviewedBy && (
              <span>Tested by: {task.testerReviewedBy.name}</span>
            )}
            {task.marketerApprovedBy && (
              <span>Approved by: {task.marketerApprovedBy.name}</span>
            )}
          </div>
          <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { key: 'creatives', label: 'Creatives', count: groupedTasks.creatives.length, icon: Palette },
    { key: 'landingPages', label: 'Landing Pages', count: groupedTasks.landingPages.length, icon: Layout },
    { key: 'content', label: 'Content', count: groupedTasks.content.length, icon: FileText },
    { key: 'other', label: 'Other', count: groupedTasks.other.length, icon: FileCheck },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Completed Assets</h1>
            <p className="text-gray-600">
              {project?.projectName || project?.businessName}
              {project?.industry && <span className="text-gray-400 ml-2">• {project.industry}</span>}
            </p>
          </div>
        </div>
        <Badge variant="success">{tasks.length} completed</Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <Card
              key={tab.key}
              className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{tab.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Tab Content */}
      <Card>
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {tabs.find(t => t.key === activeTab)?.label}
          </h2>
        </CardHeader>
        <CardBody className="p-6">
          {groupedTasks[activeTab]?.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No completed assets in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedTasks[activeTab]?.map(task => renderAssetCard(task))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}