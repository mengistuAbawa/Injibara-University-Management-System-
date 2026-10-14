import api from './api';

/* dashboard */
export const getInstructorStats = () =>
  api.get('/instructors/stats').then((r) => r.data);

/* sections */
export const getMySections = () =>
  api.get('/instructors/my-sections').then((r) => r.data);

export const getSection = (sectionId) =>
  api.get(`/instructors/sections/${sectionId}`).then((r) => r.data);

export const getSectionStudents = (sectionId) =>
  api.get(`/instructors/sections/${sectionId}/students`).then((r) => r.data);

export const getSectionPerformance = (sectionId) =>
  api.get(`/instructors/sections/${sectionId}/performance`).then((r) => r.data);

/* grades */
export const saveBulkGrades = (section_id, grades) =>
  api.post('/instructors/grades/bulk', { section_id, grades }).then((r) => r.data);

export const saveSingleGrade = (payload) =>
  api.post('/instructors/grade', payload).then((r) => r.data);

/* attendance */
export const saveAttendance = (payload) =>
  api.post('/instructors/attendance', payload).then((r) => r.data);

export const getAttendance = (sectionId, date) =>
  api
    .get(`/instructors/sections/${sectionId}/attendance?date=${date}`)
    .then((r) => r.data);