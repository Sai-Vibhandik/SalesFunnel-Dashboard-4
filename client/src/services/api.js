import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.data);
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error.response?.data || { message });
  }
);

// Auth service
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  logout: () => api.post('/auth/logout'),
  // Team management
  getTeamMembers: (params) => api.get('/auth/team', { params }),
  getTeamByRole: () => api.get('/auth/team/by-role'),
  createTeamMember: (data) => api.post('/auth/create-user', data),
  updateTeamMember: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteTeamMember: (id) => api.delete(`/auth/users/${id}`),
};

// Project service
export const projectService = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getProgress: (id) => api.get(`/projects/${id}/progress`),
  getDashboardStats: () => api.get('/projects/dashboard/stats'),
  // New endpoints
  assignTeam: (id, data) => api.put(`/projects/${id}/assign-team`, data),
  toggleActivation: (id, isActive) => api.put(`/projects/${id}/activate`, { isActive }),
  uploadAssets: (id, formData) => api.post(`/projects/${id}/assets`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAssignedProjects: (params) => api.get('/projects/assigned', { params }),
  // Landing Pages (embedded in project)
  getLandingPages: (projectId) => api.get(`/projects/${projectId}/landing-pages`),
  addLandingPage: (projectId, data) => api.post(`/projects/${projectId}/landing-pages`, data),
  getLandingPage: (projectId, landingPageId) => api.get(`/projects/${projectId}/landing-pages/${landingPageId}`),
  updateLandingPage: (projectId, landingPageId, data) => api.put(`/projects/${projectId}/landing-pages/${landingPageId}`, data),
  deleteLandingPage: (projectId, landingPageId) => api.delete(`/projects/${projectId}/landing-pages/${landingPageId}`),
  completeLandingPageStage: (projectId) => api.post(`/projects/${projectId}/landing-pages/complete`),
};

// Notification service
export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Market Research service
export const marketResearchService = {
  get: (projectId) => api.get(`/market-research/${projectId}`),
  upsert: (projectId, data) => api.post(`/market-research/${projectId}`, data),
  uploadVisionBoard: (projectId, formData) =>
    api.post(`/market-research/${projectId}/vision-board`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadStrategySheet: (projectId, formData) =>
    api.post(`/market-research/${projectId}/strategy-sheet`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Offer service
export const offerService = {
  get: (projectId) => api.get(`/offers/${projectId}`),
  upsert: (projectId, data) => api.post(`/offers/${projectId}`, data),
  addBonus: (projectId, data) => api.post(`/offers/${projectId}/bonuses`, data),
  removeBonus: (projectId, bonusId) => api.delete(`/offers/${projectId}/bonuses/${bonusId}`),
};

// Traffic Strategy service
export const trafficStrategyService = {
  get: (projectId) => api.get(`/traffic-strategy/${projectId}`),
  upsert: (projectId, data) => api.post(`/traffic-strategy/${projectId}`, data),
  addHook: (projectId, data) => api.post(`/traffic-strategy/${projectId}/hooks`, data),
  removeHook: (projectId, hookId) => api.delete(`/traffic-strategy/${projectId}/hooks/${hookId}`),
  toggleChannel: (projectId, channelName, data) =>
    api.patch(`/traffic-strategy/${projectId}/channels/${channelName}`, data),
};

// Landing Page service
export const landingPageService = {
  // List all landing pages for a project
  list: (projectId) => api.get(`/landing-pages/${projectId}`),
  // Get single landing page
  get: (projectId, landingPageId) => api.get(`/landing-pages/${projectId}/${landingPageId}`),
  // Create new landing page
  create: (projectId, data) => api.post(`/landing-pages/${projectId}`, data),
  // Update landing page
  update: (projectId, landingPageId, data) => api.put(`/landing-pages/${projectId}/${landingPageId}`, data),
  // Delete landing page
  delete: (projectId, landingPageId) => api.delete(`/landing-pages/${projectId}/${landingPageId}`),
  // Complete landing page and generate tasks
  complete: (projectId, landingPageId) => api.post(`/landing-pages/${projectId}/${landingPageId}/complete`),
  // Add nurturing method
  addNurturing: (projectId, landingPageId, data) => api.post(`/landing-pages/${projectId}/${landingPageId}/nurturing`, data),
  // Remove nurturing method
  removeNurturing: (projectId, landingPageId, nurturingId) =>
    api.delete(`/landing-pages/${projectId}/${landingPageId}/nurturing/${nurturingId}`),
  // Legacy method for backward compatibility
  upsert: (projectId, data) => api.post(`/landing-pages/${projectId}`, data),
};

// Creative Strategy service
export const creativeService = {
  get: (projectId) => api.get(`/creatives/${projectId}`),
  upsert: (projectId, data) => api.post(`/creatives/${projectId}`, data),
  generateCards: (projectId, data) => api.post(`/creatives/${projectId}/generate`, data),
  addCreative: (projectId, stage, data) =>
    api.post(`/creatives/${projectId}/stages/${stage}/creatives`, data),
  updateCreative: (projectId, stage, creativeId, data) =>
    api.put(`/creatives/${projectId}/stages/${stage}/creatives/${creativeId}`, data),
  deleteCreative: (projectId, stage, creativeId) =>
    api.delete(`/creatives/${projectId}/stages/${stage}/creatives/${creativeId}`),
  // Ad Type methods
  addAdType: (projectId, data) => api.post(`/creatives/${projectId}/ad-types`, data),
  updateAdType: (projectId, typeKey, data) => api.put(`/creatives/${projectId}/ad-types/${typeKey}`, data),
  removeAdType: (projectId, typeKey) => api.delete(`/creatives/${projectId}/ad-types/${typeKey}`),
  updateNotes: (projectId, data) => api.put(`/creatives/${projectId}/notes`, data),
};

// Task service
export const taskService = {
  // Get tasks for current user
  getMyTasks: (params) => api.get('/tasks/my-tasks', { params }),
  // Get tasks for current user by their role
  getMyRoleTasks: (params) => api.get('/tasks/my-role-tasks', { params }),
  // Get all tasks (admin/PM)
  getAllTasks: (params) => api.get('/tasks', { params }),
  // Get tasks for a project
  getProjectTasks: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  // Get single task
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  // Create task
  createTask: (data) => api.post('/tasks', data),
  // Update task
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  // Update task status
  updateTaskStatus: (taskId, data) => api.put(`/tasks/${taskId}/status`, data),
  // Update task content
  updateTaskContent: (taskId, data) => api.put(`/tasks/${taskId}/content`, data),
  // Assign task
  assignTask: (taskId, data) => api.put(`/tasks/${taskId}/assign`, data),
  // Tester review
  testerReview: (taskId, data) => api.put(`/tasks/${taskId}/tester-review`, data),
  // Marketer review
  marketerReview: (taskId, data) => api.put(`/tasks/${taskId}/marketer-review`, data),
  // Upload files
  uploadFiles: (taskId, formData) => api.post(`/tasks/${taskId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Get pending review tasks (tester)
  getPendingReview: () => api.get('/tasks/pending-review'),
  // Get pending marketer approval
  getPendingMarketerApproval: () => api.get('/tasks/pending-marketer-approval'),
  // Get approved assets (tester, admin, performance_marketer)
  getApprovedAssets: () => api.get('/tasks/approved-assets'),
  // Get completed assets for a project
  getProjectCompletedAssets: (projectId) => api.get(`/tasks/project/${projectId}/completed`),
  // Generate tasks from strategy
  generateTasks: (projectId) => api.post(`/tasks/generate/${projectId}`),
  // Get team members
  getTeamMembers: () => api.get('/tasks/team-members'),
};

// Strategy service
export const strategyService = {
  getCompleteStrategy: (projectId) => api.get(`/strategy/${projectId}`),
  markReviewed: (projectId, notes) => api.put(`/strategy/${projectId}/review`, { notes }),
  getPendingReview: () => api.get('/strategy/pending-review'),
  getStats: () => api.get('/strategy/stats'),
};

// Strategy Summary service
export const strategySummaryService = {
  getSummary: (projectId) => api.get(`/projects/${projectId}/strategy-summary`),
  getTextSummary: (projectId) => api.get(`/projects/${projectId}/strategy-summary/text`),
  getPdfContent: (projectId) => api.get(`/projects/${projectId}/strategy-summary/pdf`),
  getTaskContext: (projectId) => api.get(`/projects/${projectId}/strategy-summary/context`),
};

export default api;