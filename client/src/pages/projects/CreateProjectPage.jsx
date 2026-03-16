import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { projectService } from '@/services/api';
import { Card, CardBody, CardHeader, Button, Input } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

const projectSchema = z.object({
  projectName: z.string().min(2, 'Project name must be at least 2 characters').optional().or(z.literal('')),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  mobile: z.string().min(10, 'Please enter a valid mobile number'),
  email: z.string().email('Please enter a valid email'),
  industry: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  budget: z.string().optional().or(z.literal('')),
  timelineStartDate: z.string().optional().or(z.literal('')),
  timelineEndDate: z.string().optional().or(z.literal('')),
});

export default function CreateProjectPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: '',
      customerName: '',
      businessName: '',
      mobile: '',
      email: '',
      industry: '',
      description: '',
      budget: '',
      timelineStartDate: '',
      timelineEndDate: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Transform data for API
      const projectData = {
        customerName: data.customerName,
        businessName: data.businessName,
        mobile: data.mobile,
        email: data.email,
        projectName: data.projectName || undefined,
        industry: data.industry || undefined,
        description: data.description || undefined,
        budget: data.budget ? Number(data.budget) : undefined,
        timeline: (data.timelineStartDate || data.timelineEndDate) ? {
          startDate: data.timelineStartDate ? new Date(data.timelineStartDate) : undefined,
          endDate: data.timelineEndDate ? new Date(data.timelineEndDate) : undefined,
        } : undefined,
      };

      const response = await projectService.createProject(projectData);
      toast.success('Project created successfully!');
      // Redirect to team assignment page
      navigate(`/projects/${response.data._id}/assign-team`);
    } catch (error) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/projects')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-1">
            Start a new client project and begin the onboarding process.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the project and customer details below.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Project Name"
                  placeholder="TechStart Landing Page"
                  error={errors.projectName?.message}
                  {...register('projectName')}
                />
                <Input
                  label="Industry"
                  placeholder="Technology, E-commerce, etc."
                  error={errors.industry?.message}
                  {...register('industry')}
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of the project..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[100px]"
                  {...register('description')}
                />
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Customer Name *"
                  placeholder="John Doe"
                  error={errors.customerName?.message}
                  {...register('customerName')}
                />
                <Input
                  label="Business Name *"
                  placeholder="Acme Corporation"
                  error={errors.businessName?.message}
                  {...register('businessName')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Mobile Number *"
                  placeholder="+1 234 567 890"
                  error={errors.mobile?.message}
                  {...register('mobile')}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
            </div>

            {/* Budget & Timeline */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Budget & Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Budget ($)"
                  type="number"
                  placeholder="5000"
                  error={errors.budget?.message}
                  {...register('budget')}
                />
                <Input
                  label="Start Date"
                  type="date"
                  error={errors.timelineStartDate?.message}
                  {...register('timelineStartDate')}
                />
                <Input
                  label="End Date"
                  type="date"
                  error={errors.timelineEndDate?.message}
                  {...register('timelineEndDate')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/projects')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Create Project
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}