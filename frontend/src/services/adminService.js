import api from './api';

/* dashboard */
export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data);

/* users */
export const listUsers           = () => api.get('/admin/users').then((r) => r.data);
export const createUser          = (payload) => api.post('/admin/users', payload).then((r) => r.data);
export const toggleUserActive    = (userId) => api.patch(`/admin/users/${userId}/toggle`).then((r) => r.data);
export const changeUserRole      = (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data);
export const resetUserPassword   = (userId, password) => api.post(`/admin/users/${userId}/reset-password`, { password }).then((r) => r.data);
export const updateUser          = (id, p) => api.put(`/admin/users/${id}`, p).then((r) => r.data);
export const deleteUser          = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);

/* colleges */
export const listColleges        = () => api.get('/admin/colleges').then((r) => r.data);
export const createCollege       = (p) => api.post('/admin/colleges', p).then((r) => r.data);
export const updateCollege       = (id, p) => api.put(`/admin/colleges/${id}`, p).then((r) => r.data);
export const deleteCollege       = (id) => api.delete(`/admin/colleges/${id}`).then((r) => r.data);

/* departments */
export const listDepartments     = () => api.get('/admin/departments').then((r) => r.data);
export const createDepartment    = (p) => api.post('/admin/departments', p).then((r) => r.data);
export const updateDepartment    = (id, p) => api.put(`/admin/departments/${id}`, p).then((r) => r.data);
export const deleteDepartment    = (id) => api.delete(`/admin/departments/${id}`).then((r) => r.data);

/* courses */
export const listCourses         = () => api.get('/admin/courses').then((r) => r.data);
export const createCourse        = (p) => api.post('/admin/courses', p).then((r) => r.data);
export const updateCourse        = (id, p) => api.put(`/admin/courses/${id}`, p).then((r) => r.data);
export const deleteCourse        = (id) => api.delete(`/admin/courses/${id}`).then((r) => r.data);

/* sections */
export const listSections        = () => api.get('/admin/sections').then((r) => r.data);
export const createSection       = (p) => api.post('/admin/sections', p).then((r) => r.data);
export const updateSection       = (id, p) => api.put(`/admin/sections/${id}`, p).then((r) => r.data);
export const deleteSection       = (id) => api.delete(`/admin/sections/${id}`).then((r) => r.data);

/* fields */
export const listFields          = () => api.get('/admin/fields').then((r) => r.data);
export const createField         = (p) => api.post('/admin/fields', p).then((r) => r.data);
export const updateField         = (id, p) => api.put(`/admin/fields/${id}`, p).then((r) => r.data);
export const deleteField         = (id) => api.delete(`/admin/fields/${id}`).then((r) => r.data);

/* directories */
export const listAllStudents     = () => api.get('/admin/students').then((r) => r.data);
export const listAllInstructors  = () => api.get('/admin/instructors').then((r) => r.data);

/* HOD */
export const promoteToHod        = (p) => api.post('/admin/instructors/promote-hod', p).then((r) => r.data);
export const demoteHod           = (id) => api.patch(`/admin/instructors/${id}/demote-hod`).then((r) => r.data);

/* settings */
export const getSettings         = () => api.get('/admin/settings').then((r) => r.data);
export const updateSettings      = (p) => api.put('/admin/settings', p).then((r) => r.data);

/* results */
export const bulkPublishResults  = () => api.post('/admin/results/bulk-publish').then((r) => r.data);

/* reports */
export const getReport           = (type) => api.get(`/admin/report?type=${type}`).then((r) => r.data);
export const getLoginLog         = () => api.get('/admin/login-log').then((r) => r.data);
export const getSmsLog           = () => api.get('/admin/sms-log').then((r) => r.data);
export const runAllocation       = () => api.post('/admin/allocation/run').then((r) => r.data);
