import api from './api';

export async function getMyRequests() {
  const { data } = await api.get('/alumni/requests');
  return data;
}

export async function submitRequest(payload) {
  const { data } = await api.post('/alumni/requests', payload);
  return data;
}

export async function getProfile() {
  const { data } = await api.get('/alumni/profile');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/alumni/profile', payload);
  return data;
}

export async function getMyTranscript() {
  const { data } = await api.get('/alumni/transcript');
  return data;
}
