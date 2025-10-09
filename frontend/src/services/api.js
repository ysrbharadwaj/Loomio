import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User API
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserDashboard: (id) => api.get(`/users/${id}/dashboard`),
  getLeaderboard: (communityId, params) => api.get(`/users/leaderboard/${communityId}`, { params }),
};

// Community API
export const communityAPI = {
  getAllCommunities: (params) => api.get('/communities', { params }),
  createCommunity: (communityData) => api.post('/communities', communityData),
  getCommunityById: (id) => api.get(`/communities/${id}`),
  updateCommunity: (id, communityData) => api.put(`/communities/${id}`, communityData),
  deleteCommunity: (id) => api.delete(`/communities/${id}`),
  inviteToCommunity: (id, email) => api.post(`/communities/${id}/invite`, { email }),
  joinCommunity: (communityCode) => api.post('/communities/join', { community_code: communityCode }),
  leaveCommunity: () => api.post('/communities/leave'),
};

// Task API
export const taskAPI = {
  getAllTasks: (params) => api.get('/tasks', { params }),
  createTask: (taskData) => api.post('/tasks', taskData),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  assignTask: (id, userIds) => api.post(`/tasks/${id}/assign`, { user_ids: userIds }),
  updateTaskStatus: (id, status, submissionLink) => api.put(`/tasks/${id}/status`, { status, submission_link: submissionLink }),
};

// Attendance API
export const attendanceAPI = {
  getAllAttendance: (params) => api.get('/attendance', { params }),
  createAttendance: (attendanceData) => api.post('/attendance', attendanceData),
  updateAttendance: (id, attendanceData) => api.put(`/attendance/${id}`, attendanceData),
};

// Leave API
export const leaveAPI = {
  getAllLeaves: (params) => api.get('/leaves', { params }),
  createLeave: (leaveData) => api.post('/leaves', leaveData),
  updateLeave: (id, leaveData) => api.put(`/leaves/${id}`, leaveData),
};

// Event API
export const eventAPI = {
  getAllEvents: (params) => api.get('/events', { params }),
  createEvent: (eventData) => api.post('/events', eventData),
  getEventById: (id) => api.get(`/events/${id}`),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

// Notification API
export const notificationAPI = {
  getAllNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Analytics API
export const analyticsAPI = {
  getPlatformAnalytics: () => api.get('/analytics/platform'),
  getCommunityAnalytics: (communityId) => api.get(`/analytics/community/${communityId}`),
  getMyCommunityAnalytics: () => api.get('/analytics/my-community'),
};

export default api;
