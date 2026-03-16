import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { creativeService, projectService } from '@/services/api';
import CreativePlanner from '@/components/creative/CreativePlanner';
import { extractData } from '@/utils/apiResponse';

export default function CreativeStrategyPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [creativeData, setCreativeData] = useState(null);

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectRes, creativeRes] = await Promise.all([
        projectService.getProject(projectId),
        creativeService.get(projectId),
      ]);

      console.log('=== CreativeStrategyPage fetchData ===');
      console.log('projectRes (raw):', projectRes);

      // Extract data from response using utility
      const projectData = extractData(projectRes);

      console.log('projectData (extracted):', projectData);
      console.log('projectData._id:', projectData?._id);
      console.log('projectData.assignedTeam:', projectData?.assignedTeam);
      console.log('projectData.assignedTeam?.contentWriters:', projectData?.assignedTeam?.contentWriters);
      console.log('projectData.assignedTeam?.graphicDesigners:', projectData?.assignedTeam?.graphicDesigners);
      console.log('projectData.assignedTeam?.videoEditors:', projectData?.assignedTeam?.videoEditors);

      setProject(projectData);

      // Extract creative data
      const creative = extractData(creativeRes);
      if (creative) {
        setCreativeData(creative);
        setIsCompleted(creative.isCompleted || false);
      }
    } catch (error) {
      console.error('CreativeStrategyPage fetchData error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to load creative strategy';
      const statusCode = error?.response?.status || error?.status;

      if (statusCode === 403) {
        toast.error('Complete Landing Page Strategy first to access Creative Strategy');
        navigate('/projects');
      } else if (statusCode === 404) {
        toast.error('Project not found');
        navigate('/projects');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data, markComplete = false) => {
    try {
      setSaving(true);

      await creativeService.upsert(projectId, {
        creativePlan: data.creativePlan,
        creativeCategories: data.creativeCategories,
        additionalNotes: data.additionalNotes,
        isCompleted: markComplete,
      });

      if (markComplete) {
        navigate(`/tasks?projectId=${projectId}`);
      }
    } catch (error) {
      console.error('Creative strategy save error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save creative strategy';
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Creative Strategy</h1>
          <p className="text-gray-600 mt-1">{project?.businessName || project?.projectName}</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      {/* Creative Planner */}
      <CreativePlanner
        projectId={projectId}
        initialData={creativeData}
        onSave={handleSave}
        isCompleted={isCompleted}
        project={project}
      />
    </div>
  );
}