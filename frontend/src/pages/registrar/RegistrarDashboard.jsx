import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRegistrarStats } from '../../services/registrarService';
import './RegistrarDashboard.css';

export default function RegistrarDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});

  useEffect(() => {
    getRegistrarStats().then(setStats).catch(console.error);
  }, []);

  const cards = [
    { label: 'Total Students',      value: stats.total_students,     color: '#2b7de9' },
    { label: 'Active Students',     value: stats.active_students,    color: '#26a69a' },
    { label: 'Sections',            value: stats.total_sections,     color: '#ef6c00' },
    { label: 'Enrollments',         value: stats.total_enrollments,  color: '#8e24aa' },
    { label: 'Pending Results',     value: stats.pending_results,    color: '#c62828' },
  ];

  return (
    <div className="reg-dash">
      <div className="title-strip">
        Welcome, {user.first_name} {user.last_name} — Registrar Dashboard
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card" style={{ background: c.color }}>
            <div className="stat-value">{c.value ?? '—'}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-grid">
        <Link to="/registrar/create-student" className="quick-card">
          <div className="qc-icon">➕</div>
          <div className="qc-title">Register New Student</div>
          <div className="qc-desc">Create account + auto temp password</div>
        </Link>
        <Link to="/registrar/enroll" className="quick-card">
          <div className="qc-icon">📝</div>
          <div className="qc-title">Enroll Student</div>
          <div className="qc-desc">Add student to a section</div>
        </Link>
        <Link to="/registrar/registration-requests" className="quick-card">
          <div className="qc-icon">📝</div>
          <div className="qc-title">Review Course Requests</div>
          <div className="qc-desc">Approve or reject student course registrations</div>
        </Link>
        <Link to="/registrar/manage" className="quick-card">
          <div className="qc-icon">👥</div>
          <div className="qc-title">Manage Students</div>
          <div className="qc-desc">Search, edit, deactivate</div>
        </Link>
        <Link to="/registrar/publish" className="quick-card">
          <div className="qc-icon">📢</div>
          <div className="qc-title">Publish Field Results</div>
          <div className="qc-desc">Assign final placement</div>
        </Link>
        <Link to="/registrar/transcript" className="quick-card">
          <div className="qc-icon">🎓</div>
          <div className="qc-title">View Transcript</div>
          <div className="qc-desc">Grades + CGPA</div>
        </Link>
        <Link to="/registrar/sections" className="quick-card">
          <div className="qc-icon">📚</div>
          <div className="qc-title">Section Enrollments</div>
          <div className="qc-desc">See who is enrolled where</div>
        </Link>
      </div>
    </div>
  );
}
