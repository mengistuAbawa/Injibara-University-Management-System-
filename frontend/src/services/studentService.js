import api from './api';
export const getMyCourses = () => api.get('/students/my-courses').then(r => r.data);
export const getMyGrades  = () => api.get('/students/my-grades').then(r => r.data);
export const getMyStatus  = () => api.get('/students/my-status').then(r => r.data);
export const getTutorials = () => api.get('/students/placement-tutorials').then(r => r.data);
export const getFields    = () => api.get('/students/available-fields').then(r => r.data);
export const selectFields = (fields) => api.post('/students/select-fields', { fields }).then(r => r.data);
export const getResults   = () => api.get('/students/selection-results').then(r => r.data);
export const getPriority  = () => api.get('/students/priority-summary').then(r => r.data);
export const getMyProfile      = () => api.get('/students/my-profile').then(r => r.data);
export const getPrioritySummary = (filters = {}) => {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return api.get(`/students/priority-summary${qs ? `?${qs}` : ''}`).then(r => r.data);
};