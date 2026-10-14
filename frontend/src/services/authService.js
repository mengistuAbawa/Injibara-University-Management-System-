import api from './api';
export const loginApi = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);