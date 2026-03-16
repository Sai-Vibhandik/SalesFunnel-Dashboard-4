import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardBody, Button, Spinner } from '@/components/ui';
import { StageProgressTracker } from '@/components/workflow';
import LandingPagesList from '@/components/landing-pages/LandingPagesList';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { projectService } from '@/services/api';

export default function LandingPagesListPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProject(projectId);
      setProject(response.data);

      // Check if traffic strategy is completed
      if (!response.data.stages?.trafficStrategy?.isCompleted) {
        toast.error('Complete Traffic Strategy first to access Landing Pages');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
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
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-gray-600 mt-1">{project?.businessName}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Stage 5 of 6</div>
        </div>
      </div>

      {/* Completion Banner */}
      {project?.stages?.landingPage?.isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-800">Stage Completed!</h3>
            <p className="text-sm text-green-600">You can proceed to Creative Strategy.</p>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardBody className="p-4">
          <StageProgressTracker stages={project?.stages} currentStage={project?.currentStage} />
        </CardBody>
      </Card>

      {/* Landing Pages List */}
      <Card>
        <CardBody className="p-6">
          <LandingPagesList projectId={projectId} />
        </CardBody>
      </Card>
    </div>
  );
}