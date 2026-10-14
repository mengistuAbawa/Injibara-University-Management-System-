import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../services/adminService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    getAdminStats().then(setStats).catch(console.error);
  }, []);

  const cards = [
    { label: 'Students',    value: stats.students,    color: '#2b7de9', icon: '🎓' },
    { label: 'Instructors', value: stats.instructors, color: '#26a69a', icon: '👨‍🏫' },
    { label: 'Courses',     value: stats.courses,     color: '#7cb342', icon: '📚' },
    { label: 'Sections',    value: stats.sections,    color: '#ef6c00', icon: '🏫' },
    { label: 'Departments', value: stats.departments, color: '#8e24aa', icon: '🏛' },
    { label: 'Fields',      value: stats.fields,      color: '#c62828', icon: '🌱' },
    { label: 'Enrollments', value: stats.enrollments, color: '#00acc1', icon: '📝' },
    { label: 'Users',       value: stats.users,       color: '#5e35b1', icon: '👥' },
  ];

  return (
    <div className="admin-dash">
      <div className="title-strip">
        Welcome, Admin{user?.first_name ? ` ${user.first_name} ${user.last_name || ''}` : user?.email ? ` ${user.email}` : ''}
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ background: c.color }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{c.value ?? '—'}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3 className="section-title">System Management</h3>
      <div className="quick-grid">
        <Link to="/admin/users"       className="quick-card"><div className="qc-icon">👥</div><div><div className="qc-title">Manage Users</div><div className="qc-desc">Create, deactivate, reset passwords</div></div></Link>
        <Link to="/admin/departments" className="quick-card"><div className="qc-icon">🏛</div><div><div className="qc-title">Manage Departments</div><div className="qc-desc">Add/edit/remove departments</div></div></Link>
        <Link to="/admin/courses"     className="quick-card"><div className="qc-icon">📚</div><div><div className="qc-title">Manage Courses</div><div className="qc-desc">Curriculum per department</div></div></Link>
        <Link to="/admin/sections"    className="quick-card"><div className="qc-icon">🏫</div><div><div className="qc-title">Manage Sections</div><div className="qc-desc">Offerings + instructor assignment</div></div></Link>
        <Link to="/admin/fields"      className="quick-card"><div className="qc-icon">🌱</div><div><div className="qc-title">Manage Fields</div><div className="qc-desc">Specialization list</div></div></Link>
        <Link to="/admin/students"    className="quick-card"><div className="qc-icon">🎓</div><div><div className="qc-title">Student Directory</div><div className="qc-desc">All students across departments</div></div></Link>
        <Link to="/admin/instructors" className="quick-card"><div className="qc-icon">👨‍🏫</div><div><div className="qc-title">Instructor Directory</div><div className="qc-desc">All faculty + assign HOD</div></div></Link>
        <Link to="/admin/settings"    className="quick-card"><div className="qc-icon">⚙️</div><div><div className="qc-title">System Settings</div><div className="qc-desc">Academic year, semester, flags</div></div></Link>
        <Link to="/admin/reports"     className="quick-card"><div className="qc-icon">📊</div><div><div className="qc-title">Reports</div><div className="qc-desc">System-wide analytics</div></div></Link>
      </div>
    </div>
  );
}
