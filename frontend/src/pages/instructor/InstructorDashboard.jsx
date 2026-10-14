import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInstructorStats, getMySections } from '../../services/instructorService';
import './InstructorDashboard.css';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [sections, setSections] = useState([]);

  useEffect(() => {
    getInstructorStats().then(setStats).catch(console.error);
    getMySections().then(setSections).catch(console.error);
  }, []);

  const cards = [
    { label: 'My Sections',    value: stats.total_sections,  color: '#2b7de9' },
    { label: 'My Students',    value: stats.total_students,  color: '#26a69a' },
    { label: 'Graded',         value: stats.graded_count,    color: '#7cb342' },
    { label: 'Pending Grades', value: stats.pending_grades,  color: '#ef6c00' },
  ];

  return (
    <div className="inst-dash">
      <div className="title-strip">
        Welcome, {user.academic_rank} {user.first_name} {user.last_name}
        {user.is_hod && <span className="hod-badge"> · HOD</span>}
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
        <Link to="/instructor/sections" className="quick-card">
          <div className="qc-icon">📚</div>
          <div className="qc-title">My Sections</div>
          <div className="qc-desc">View all assigned sections</div>
        </Link>
        <Link to="/instructor/grades" className="quick-card">
          <div className="qc-icon">✍️</div>
          <div className="qc-title">Enter Grades</div>
          <div className="qc-desc">Bulk grade entry per section</div>
        </Link>
        <Link to="/instructor/attendance" className="quick-card">
          <div className="qc-icon">🗓</div>
          <div className="qc-title">Take Attendance</div>
          <div className="qc-desc">Mark present/absent per day</div>
        </Link>
      </div>

      <h3 className="section-title">My Sections at a Glance</h3>
      {sections.length === 0 ? (
        <p className="empty">No sections assigned yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th><th>Course Title</th><th>Semester</th>
              <th>Year</th><th>Room</th><th>Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.section_id}>
                <td>{s.course_code}</td>
                <td>{s.course_title}</td>
                <td>{s.semester}</td>
                <td>{s.academic_year}</td>
                <td>{s.room}</td>
                <td>{s.enrolled} / {s.capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}