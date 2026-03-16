import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService, projectService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, Spinner, Button, Badge, Modal, Input } from '@/components/ui';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  X,
  Save,
  User,
  Briefcase,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Role options
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'performance_marketer', label: 'Performance Marketer' },
  { value: 'content_writer', label: 'Content Writer' },
  { value: 'ui_ux_designer', label: 'UI/UX Designer' },
  { value: 'graphic_designer', label: 'Graphic Designer' },
  { value: 'video_editor', label: 'Video Editor' },
  { value: 'developer', label: 'Developer' },
  { value: 'tester', label: 'Tester' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-yellow-500' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-400' },
];

// Team Member Card Component
function TeamMemberRow({ member, onEdit, onDelete }) {
  const roleLabels = {
    admin: 'Admin',
    performance_marketer: 'Performance Marketer',
    content_writer: 'Content Writer',
    ui_ux_designer: 'UI/UX Designer',
    graphic_designer: 'Graphic Designer',
    video_editor: 'Video Editor',
    developer: 'Developer',
    tester: 'Tester',
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    performance_marketer: 'bg-blue-100 text-blue-700',
    content_writer: 'bg-emerald-100 text-emerald-700',
    ui_ux_designer: 'bg-purple-100 text-purple-700',
    graphic_designer: 'bg-pink-100 text-pink-700',
    video_editor: 'bg-cyan-100 text-cyan-700',
    developer: 'bg-green-100 text-green-700',
    tester: 'bg-orange-100 text-orange-700',
  };

  const availabilityColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {member.name?.charAt(0).toUpperCase()}
            </div>
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
              availabilityColors[member.availability]
            )} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge className={cn('text-xs', roleColors[member.role])}>
          {roleLabels[member.role]}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-gray-600">{member.specialization || '-'}</span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', availabilityColors[member.availability])} />
          <span className="text-sm text-gray-600 capitalize">{member.availability}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge className={member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {member.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(member)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(member)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Create/Edit Modal
function TeamMemberModal({ isOpen, onClose, member, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'performance_marketer',
    specialization: '',
    availability: 'available',
    projectId: '',
    projectRole: '',
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  // Fetch projects for assignment dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getProjects({ limit: 100 });
        setProjects(response.data || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        password: '',
        role: member.role || 'performance_marketer',
        specialization: member.specialization || '',
        availability: member.availability || 'available',
        projectId: '',
        projectRole: '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'performance_marketer',
        specialization: '',
        availability: 'available',
        projectId: '',
        projectRole: '',
      });
    }
    setError('');
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!member && !formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (!member && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      const errorMessage = error?.message || error?.errors?.[0] || 'Failed to save team member';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Map role to project assignment field
  const roleToProjectRole = {
    'performance_marketer': 'performance_marketer',
    'ui_ux_designer': 'ui_ux_designer',
    'graphic_designer': 'graphic_designer',
    'developer': 'developer',
    'tester': 'tester',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              required
            />
          </div>

          {!member && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 6 characters)</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required={!member}
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setFormData({
                  ...formData,
                  role: newRole,
                  projectRole: roleToProjectRole[newRole] || '',
                });
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <Input
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g., Facebook Ads, React Development"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Assignment (only for new members) */}
          {!member && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Project (Optional)
              </label>
              <div className="space-y-2">
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.projectName || project.businessName}
                    </option>
                  ))}
                </select>
                {formData.projectId && (
                  <p className="text-xs text-gray-500">
                    User will be assigned as {ROLE_OPTIONS.find(r => r.value === formData.role)?.label} to the selected project
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : member ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, member, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Team Member</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to deactivate <strong>{member.name}</strong>? They will lose access to the dashboard.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamManagementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchTeamMembers();
  }, [searchTerm, roleFilter, availabilityFilter]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (availabilityFilter) params.availability = availabilityFilter;

      const response = await authService.getTeamMembers(params);
      setTeamMembers(response.data || []);
    } catch (error) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (formData) => {
    try {
      // Prepare data for API
      const apiData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        specialization: formData.specialization || '',
        availability: formData.availability || 'available',
      };

      // Add project assignment if selected
      if (formData.projectId) {
        apiData.projectId = formData.projectId;
        apiData.projectRole = formData.role;
      }

      const response = await authService.createTeamMember(apiData);
      toast.success(response.message || 'Team member created successfully');
      fetchTeamMembers();
    } catch (error) {
      const errorMessage = error?.message || error?.errors?.[0] || 'Failed to create team member';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdateMember = async (formData) => {
    try {
      const apiData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        specialization: formData.specialization || '',
        availability: formData.availability || 'available',
      };

      await authService.updateTeamMember(selectedMember._id, apiData);
      toast.success('Team member updated successfully');
      fetchTeamMembers();
    } catch (error) {
      const errorMessage = error?.message || error?.errors?.[0] || 'Failed to update team member';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDeleteMember = async () => {
    try {
      await authService.deleteTeamMember(selectedMember._id);
      toast.success('Team member deactivated successfully');
      fetchTeamMembers();
    } catch (error) {
      toast.error(error.message || 'Failed to deactivate team member');
      throw error;
    }
  };

  const openCreateModal = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const openDeleteModal = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const roleLabels = {
    admin: 'Admin',
    performance_marketer: 'Performance Marketer',
    content_writer: 'Content Writer',
    ui_ux_designer: 'UI/UX Designer',
    graphic_designer: 'Graphic Designer',
    video_editor: 'Video Editor',
    developer: 'Developer',
    tester: 'Tester',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage your team members and their roles</p>
        </div>
        <Button onClick={openCreateModal}>
          <UserPlus size={18} className="mr-2" />
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Availability</option>
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setRoleFilter('');
            setAvailabilityFilter('');
          }}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(roleLabels).map(([role, label]) => {
          const count = teamMembers.filter(m => m.role === role).length;
          const colors = {
            admin: 'bg-red-500',
            performance_marketer: 'bg-blue-500',
            content_writer: 'bg-emerald-500',
            ui_ux_designer: 'bg-purple-500',
            graphic_designer: 'bg-pink-500',
            video_editor: 'bg-cyan-500',
            developer: 'bg-green-500',
            tester: 'bg-orange-500',
          };
          return (
            <div key={role} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-3 h-3 rounded-full', colors[role])} />
                <span className="text-sm text-gray-600 truncate">{label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No team members found</h3>
            <p className="text-gray-500 mt-1">Add team members to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <TeamMemberRow
                    key={member._id}
                    member={member}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        member={selectedMember}
        onSave={selectedMember ? handleUpdateMember : handleCreateMember}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        member={selectedMember}
        onConfirm={handleDeleteMember}
      />
    </div>
  );
}