import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on login endpoints - let them handle their own errors
    const isLoginEndpoint = error.config?.url?.includes('/auth/admin/login') || 
                           error.config?.url?.includes('/auth/student/login');
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !isLoginEndpoint) {
      // Get user role from localStorage before clearing
      const user = localStorage.getItem('user');
      let userRole = null;
      
      try {
        userRole = user ? JSON.parse(user).role : null;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect based on user role or current path
      if (userRole === 'admin' || window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/student/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const adminLogin = (email, password) =>
  api.post('/auth/admin/login', { email, password });

export const studentLogin = (registerNo, password) =>
  api.post('/auth/student/login', { registerNo, password });

// Admin APIs
export const importStudents = (file) => {
  const formData = new FormData();
  formData.append('csv', file);
  return api.post('/admin/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const addStudent = (studentData) =>
  api.post('/admin/students', studentData);

export const getStudents = () => api.get('/admin/students');

export const addCandidate = (candidateData) =>
  api.post('/admin/candidates', candidateData);

export const getCandidates = () => api.get('/admin/candidates');

export const updateCandidate = (id, candidateData) =>
  api.put(`/admin/candidates/${id}`, candidateData);

export const deleteCandidate = (id) => api.delete(`/admin/candidates/${id}`);

export const startVoting = () => api.post('/admin/control/start');

export const nextPost = () => api.post('/admin/control/next');

export const endVoting = () => api.post('/admin/control/end');

export const getPostTotals = () => api.get('/admin/post-totals');

export const announceResult = (post) => api.post(`/admin/announce/${post}`);

export const restorePosts = () => api.post('/admin/posts/restore');

export const getAdminPosts = () => api.get('/admin/posts');

// Student APIs
export const getCurrentPost = () => api.get('/student/posts/current');

// Public APIs
export const getPosts = () => api.get('/posts');

export const getCandidatesByPost = (post) => api.get(`/candidates/${post}`);

export const getForumCommittee = () => api.get('/forum-committee');

// Vote API
export const submitVote = (studentRegisterNo, post, candidateId) =>
  api.post('/vote', { studentRegisterNo, post, candidateId });

export default api;

