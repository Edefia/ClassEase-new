import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://classease-new.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
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
API.interceptors.response.use(
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

export default API;

// ============================================================
// Centralized API Service Layer
// All API calls go through these functions — never call API.get/post directly in components
// ============================================================

export const authService = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const venueService = {
  getAll: (params) => API.get('/venues', { params }),
  getById: (id) => API.get(`/venues/${id}`),
  create: (data) => API.post('/venues', data),
  update: (id, data) => API.put(`/venues/${id}`, data),
  delete: (id) => API.delete(`/venues/${id}`),
  uploadImage: (formData) => API.post('/venues/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  addMaintenance: (id, data) => API.post(`/venues/${id}/maintenance`, data),
  removeMaintenance: (id, maintenanceId) => API.delete(`/venues/${id}/maintenance/${maintenanceId}`),
};

export const bookingService = {
  getAll: (params) => API.get('/bookings', { params }),
  create: (data) => API.post('/bookings', data),
  approve: (id, reviewNote) => API.put(`/bookings/${id}/approve`, { reviewNote }),
  decline: (id, reason, reviewNote) => API.put(`/bookings/${id}/decline`, { reason, reviewNote }),
};

export const userService = {
  getAll: () => API.get('/users'),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

export const buildingService = {
  getAll: () => API.get('/buildings'),
  getManaged: () => API.get('/buildings/managed'),
  create: (data) => API.post('/buildings', data),
  update: (id, data) => API.put(`/buildings/${id}`, data),
  delete: (id) => API.delete(`/buildings/${id}`),
};

export const departmentService = {
  getAll: () => API.get('/departments'),
  create: (data) => API.post('/departments', data),
  update: (id, data) => API.put(`/departments/${id}`, data),
  delete: (id) => API.delete(`/departments/${id}`),
};

export const statsService = {
  getAll: () => API.get('/stats'),
};

export const notificationService = {
  getMy: (params) => API.get('/notifications/my', { params }),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/mark-all-read'),
  create: (data) => API.post('/notifications', data),
  getAll: (params) => API.get('/notifications', { params }),
  delete: (id) => API.delete(`/notifications/${id}`),
};