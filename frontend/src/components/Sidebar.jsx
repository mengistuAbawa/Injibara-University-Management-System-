import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrioritySummaryModal from './PrioritySummaryModal';
import ProfilePhoto from './ProfilePhoto';
import './Sidebar.css';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const [showPriority, setShowPriority] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ---------- Public menu (not logged in) ---------- */
  if (!user) {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">Main Menu</div>
        <ul className="sidebar-list">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/graduated">Graduated Students</Link></li>
          <li><Link to="/apply">Apply for Admission</Link></li>
          <li><Link to="/apply/status">Check Application</Link></li>
          <li>
            <a href="https://inu.edu.et" target="_blank" rel="noreferrer">
              INU Web Site
            </a>
          </li>
        </ul>
      </aside>
    );
  }

  /* ---------- Role-based menus (after login) ---------- */
  const menus = {
    student: [
      { to: '/dashboard',           label: 'Home' },
      { to: '/placement-tutorials', label: 'Placement Tutorials' },
      { to: '/my-course',           label: 'My Course' },
      { to: '/my-status',           label: 'My Status' },
      { to: '/my-grade',            label: 'My Grade' },
      { to: '/field-selection',     label: 'Field Selection' },
      { to: '/selection-results',   label: 'Selection Results Summary' },
      { to: '/my-fees',             label: 'My Fees' },
      { popup: 'priority',          label: 'Priority Summary' },
    ],
 alumni: [
  { to: '/alumni/dashboard', label: 'Home' },
  { to: '/alumni/request', label: 'Request Document' },
  { to: '/alumni/requests', label: 'My Requests' },
  { to: '/alumni/profile', label: 'My Profile' },
  { to: '/alumni/transcript', label: 'Transcript' },
],
 finance: [
  { to: '/finance/dashboard', label: 'Dashboard' },
  { to: '/finance/fees', label: 'Fee Types' },
  { to: '/finance/invoices', label: 'Invoices' },
  { to: '/finance/payments', label: 'Payments' },
  { to: '/finance/reports', label: 'Reports' },
],
 dean: [
  { to: '/dean/dashboard', label: '🏛 Dean Dashboard' },
  { to: '/dean/departments', label: '🏢 Departments' },
  { to: '/dean/offerings', label: '📚 Course Offerings' },
  { to: '/dean/grade-approvals', label: '✅ Grade Approvals' },
  { to: '/dean/statistics', label: '📊 Statistics' },
  { to: '/dean/allocation-results', label: '📑 Allocation Results' },
  { to: '/dean/hods', label: '👨‍🏫 HOD Monitor' },
  { to: '/dean/ng-students', label: '⚠️ NG Students' },
  { to: '/dean/top-students', label: '🏆 Top Students' },
],
 instructor: [
  { to: '/instructor/dashboard',    label: 'Dashboard' },
  { to: '/instructor/sections',     label: 'My Sections' },
  { to: '/instructor/grades',       label: 'Enter Grades' },
  { to: '/instructor/attendance',   label: 'Take Attendance' },
  { to: '/instructor/performance',  label: 'Class Performance' },
],
 registrar: [
  { to: '/registrar/dashboard',      label: 'Dashboard' },
  { to: '/registrar/access-requests', label: 'Access Requests' },
  { to: '/registrar/accounts',       label: 'Student Passwords' },
  { to: '/registrar/create-student', label: 'Register Student' },
  { to: '/registrar/enroll',         label: 'Enroll Student' },
  { to: '/registrar/manage',         label: 'Manage Students' },
  { to: '/registrar/publish',        label: 'Publish Results' },
  { to: '/registrar/transcript',     label: 'View Transcript' },
  { to: '/registrar/sections',       label: 'Section Enrollments' },
],
admin: [
  { to: '/admin/dashboard',   label: 'Dashboard' },
  { to: '/admin/access-requests', label: 'Access Requests' },
  { to: '/admin/users',       label: 'Users' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/courses',     label: 'Courses' },
  { to: '/admin/sections',    label: 'Sections' },
  { to: '/admin/fields',      label: 'Fields' },
  { to: '/admin/students',    label: 'Students' },
  { to: '/admin/instructors', label: 'Instructors' },
  { to: '/admin/reports',     label: 'Reports' },
  { to: '/admin/settings',    label: 'Settings' },
],
  };

 const hodMenu = user.is_hod ? [
  { to: '/hod/dashboard',   label: 'HOD Dashboard' },
  { to: '/hod/overview',    label: 'Department Overview' },
  { to: '/hod/courses',     label: 'Manage Courses' },
  { to: '/hod/assign',      label: 'Assign Instructor' },
  { to: '/hod/performance', label: 'Performance Report' },
  { to: '/hod/students',    label: 'Department Students' },
] : [];

 const menuRole = role === 'student' && user.status === 'Graduated' ? 'alumni' : role;
 const current = user.is_dean
   ? [...(menus.dean || []), ...(menus.instructor || [])]
   : [...(menus[menuRole] || []), ...hodMenu];

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          {menuRole.charAt(0).toUpperCase() + menuRole.slice(1)} Menu
          {user.is_hod && ' (HOD)'}
        </div>

        <ProfilePhoto />

        <ul className="sidebar-list">
          {current.map((item, i) => (
            <li key={i}>
              {item.popup === 'priority' ? (
                <button
                  className="sidebar-popup-btn"
                  onClick={() => setShowPriority(true)}
                >
                  {item.label}
                </button>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
            </li>
          ))}
          {role === 'instructor' && location.pathname !== '/instructor/dashboard' && (
            <li><Link to="/instructor/dashboard">Cancel</Link></li>
          )}
          <li><a href="https://inu.edu.et" target="_blank" rel="noreferrer">INU Website</a></li>
          <li className="logout-item">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </aside>

      {showPriority && (
        <PrioritySummaryModal onClose={() => setShowPriority(false)} />
      )}
    </>
  );
}
