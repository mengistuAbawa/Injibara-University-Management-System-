import api from './api';
export const listFields = () => api.get('/fields').then(r => r.data);