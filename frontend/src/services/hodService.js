import api from './api';

export const getOverview = () =>
  api.get('/hod/overview').then((r) => r.data);

export const listInstructors = () =>
  api.get('/hod/instructors').then((r) => r.data);

export const listCourses = () =>
  api.get('/hod/courses').then((r) => r.data);

export const createCourse = (payload) =>
  api.post('/hod/courses', payload).then((r) => r.data);

export const updateCourse = (courseId, payload) =>
  api.put(`/hod/courses/${courseId}`, payload).then((r) => r.data);

export const listSections = () =>
  api.get('/hod/sections').then((r) => r.data);

export const listStudents = (filters = {}) => {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v)
  ).toString();
  return api.get(`/hod/students${qs ? `?${qs}` : ''}`).then((r) => r.data);
};

export const assignInstructor = (payload) =>
  api.post('/hod/assign', payload).then((r) => r.data);

export const unassignInstructor = (sectionId) =>
  api.delete(`/hod/sections/${sectionId}/unassign`).then((r) => r.data);

export const updateSection = (sectionId, payload) =>
  api.put(`/hod/sections/${sectionId}`, payload).then((r) => r.data);

export const getPerformance = () =>
  api.get('/hod/performance').then((r) => r.data);

export const getGradeDistribution = () =>
  api.get('/hod/grade-distribution').then((r) => r.data);

export const approveCourse = (courseId) =>
  api.patch(`/hod/courses/${courseId}/approve`).then((r) => r.data);
