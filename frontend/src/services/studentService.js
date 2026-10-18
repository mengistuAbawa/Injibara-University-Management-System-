import api from './api';
export const getMyCourses = () => api.get('/students/my-courses').then(r => r.data);
export const getMyGrades  = () => api.get('/students/my-grades').then(r => r.data);
export const getMyStatus  = () => api.get('/students/my-status').then(r => r.data);
export const getTutorials = () => api.get('/students/placement-tutorials').then(r => r.data);
export const getFields    = () => api.get('/students/available-fields').then(r => r.data);
export const getAvailableDepartments = (includeUnavailable = false) =>
  api.get('/students/available-departments', { params: includeUnavailable ? { include_unavailable: 1 } : {} }).then(r => r.data);
export const getMyFieldPriorities = () => api.get('/students/my-field-priorities').then(r => r.data);
export const getFieldSelectionStatus = () => api.get('/students/field-selection-status').then(r => r.data);
export const selectFields = (priorities) => {
  const normalized = priorities.map((item, index) => typeof item === 'object'
    ? { field_id: Number(item.field_id), priority: Number(item.priority) }
    : { field_id: Number(item), priority: index + 1 });
  return api.post('/students/select-fields', { priorities: normalized }).then(r => r.data);
};
export const getResults   = () => api.get('/students/selection-results').then(r => r.data);
export const getPriority  = () => api.get('/students/priority-summary').then(r => r.data);
export const getMyProfile      = () => api.get('/students/my-profile').then(r => r.data);
export const getPrioritySummary = (filters = {}) => {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return api.get(`/students/priority-summary${qs ? `?${qs}` : ''}`).then(r => r.data);
};
