import api from './api';

export const listRegistrationSections = () => api.get('/registrations/sections').then(r => r.data);
export const getMyRegistrationRequest = () => api.get('/registrations/mine').then(r => r.data);
export const submitRegistrationRequest = (payload) => api.post('/registrations/requests', payload).then(r => r.data);
export const listRegistrationRequests = (status) =>
  api.get('/registrations/requests', { params: status ? { status } : {} }).then(r => r.data);
export const getRegistrationRequest = (requestId) =>
  api.get(`/registrations/requests/${requestId}`).then(r => r.data);
export const reviewRegistrationRequest = (requestId, payload) =>
  api.patch(`/registrations/requests/${requestId}/review`, payload).then(r => r.data);
