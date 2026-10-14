import api from './api';

/* dashboard */
export const getRegistrarStats    = () => api.get('/registrar/stats').then(r => r.data);

/* students */
export const createStudent         = (payload) => api.post('/registrar/students', payload).then(r => r.data);
export const searchStudents        = (q)       => api.get('/registrar/students/search', { params: { q } }).then(r => r.data);
export const getStudent            = (id)      => api.get(`/registrar/students/${id}`).then(r => r.data);
export const updateStudent         = (id, data) => api.put(`/registrar/students/${id}`, data).then(r => r.data);

/* enrollments */
export const listSections          = ()         => api.get('/registrar/sections').then(r => r.data);
export const getSectionStudents = (sectionId) =>
  api.get(`/registrar/sections/${sectionId}/students`).then(r => r.data);
export const enrollStudent         = (payload)  => api.post('/registrar/enrollments', payload).then(r => r.data);
export const getStudentEnrollments = (studentId) =>
  api.get(`/registrar/students/${studentId}/enrollments`).then(r => r.data);
export const dropEnrollment        = (id) =>
  api.patch(`/registrar/enrollments/${id}/drop`).then(r => r.data);

/* results */
export const publishResult         = (payload) => api.post('/registrar/results/publish', payload).then(r => r.data);
export const bulkPublishResults    = ()        => api.post('/registrar/results/bulk-publish').then(r => r.data);

/* transcript */
export const getTranscript         = (studentId) =>
  api.get(`/registrar/transcript/${studentId}`).then(r => r.data);
