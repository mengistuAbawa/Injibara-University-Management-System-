import api from './api';
export const publishResult = (payload) => api.post('/selections/publish', payload).then(r => r.data);