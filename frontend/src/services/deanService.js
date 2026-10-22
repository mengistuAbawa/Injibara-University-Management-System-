/** API accessors for college-scoped dean dashboards and curriculum workflows. */
import api from './api';

const data = (promise) => promise.then((response) => response.data);
export const getOverview = () => data(api.get('/dean/overview'));
export const getStatistics = () => data(api.get('/dean/statistics'));
export const listDepartments = () => data(api.get('/dean/departments'));
export const createDepartment = (payload) => data(api.post('/dean/departments', payload));
export const updateDepartment = (id, payload) => data(api.put(`/dean/departments/${id}`, payload));
export const listCourses = (departmentId) => data(api.get('/dean/courses', { params: departmentId ? { department_id: departmentId } : {} }));
export const listOfferings = (departmentId, params = {}) => data(api.get(`/dean/departments/${departmentId}/offerings`, { params }));
export const createOffering = (departmentId, payload) => data(api.post(`/dean/departments/${departmentId}/offerings`, payload));
export const deleteOffering = (id) => data(api.delete(`/dean/offerings/${id}`));
export const listGradeUploads = () => data(api.get('/dean/grade-uploads'));
export const reviewGradeUpload = (sectionId, payload) => data(api.patch(`/dean/grade-uploads/${sectionId}`, payload));
export const listAllocationResults = () => data(api.get('/dean/allocation-results'));
export const listHods = () => data(api.get('/dean/hods'));
export const getHodPerformance = (instructorId) => data(api.get(`/dean/hods/${instructorId}/performance`));
export const listNgStudents = (departmentId) => data(api.get('/dean/ng-students', { params: departmentId ? { department_id: departmentId } : {} }));
export const listTopStudents = (limit = 20) => data(api.get('/dean/top-students', { params: { limit } }));
