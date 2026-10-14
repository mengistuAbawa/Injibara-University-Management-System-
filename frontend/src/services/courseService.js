import api from './api';
export const listCourses = () => api.get('/courses').then(r => r.data);