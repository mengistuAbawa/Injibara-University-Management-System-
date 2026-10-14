import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOverview, getPerformance } from '../../services/hodService';
import './HodDashboard.css';

export default function HodDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [perf, setPerf] = useState([]);

  useEffect(() => {
    getOverview().then(setData).catch(console.error);
    getPerformance().then(setPerf).catch(console.error);
  }, []);

  const cards = [
    { label: 'Students',    value: data.total_students,    color: '#2b7de9', icon: '🎓' },
    { label: 'Instructors', value: data.total_instructors, color: '#26a69a', icon: '👨‍🏫' },
    { label: 'Courses',     value: data.total_courses,     color: '#7cb342', icon: '📚' },
    { label: 'Sections',    value: data.total_sections,    color: '#ef6c00', icon: '🏫' },
  ];

  return (
    <div className="hod-dash">
      <Link to="/hod/assign" className="hod-assign-button">Assign Instructor</Link>
      <div className="title-strip">
        Welcome, HOD {user.first_name} {user.last_name}
        {data.department?.department_name && ` — ${data.department.department_name}`}
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

      <h3 className="section-title">Department Management</h3>
      <div className="quick-grid">
        <Link to="/hod/overview"    className="quick-card"><div className="qc-icon">📊</div><div><div className="qc-title">Department Overview</div><div className="qc-desc">Full roster + courses</div></div></Link>
        <Link to="/hod/assign"      className="quick-card"><div className="qc-icon">👨‍🏫</div><div><div className="qc-title">Assign Instructor</div><div className="qc-desc">Sections in your department</div></div></Link>
        <Link to="/hod/performance" className="quick-card"><div className="qc-icon">📈</div><div><div className="qc-title">Performance Report</div><div className="qc-desc">Course averages + pass rates</div></div></Link>
        <Link to="/hod/students"    className="quick-card"><div className="qc-icon">🎓</div><div><div className="qc-title">Department Students</div><div className="qc-desc">Filter by year / status</div></div></Link>
      </div>

      <h3 className="section-title">Course Performance (Top 10)</h3>
      {perf.length === 0 ? (
        <p className="empty">No performance data yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th><th>Title</th><th>Credit</th>
              <th>Sections</th><th>Students</th>
              <th>Avg Mark</th><th>Passed</th><th>Failed</th>
            </tr>
          </thead>
          <tbody>
            {perf.slice(0, 10).map((p) => (
              <tr key={p.course_id}>
                <td>{p.course_code}</td>
                <td>{p.course_title}</td>
                <td>{p.credit_hours}</td>
                <td>{p.sections}</td>
                <td>{p.students}</td>
                <td>{p.avg_mark ?? '—'}</td>
                <td className="pass">{p.passed}</td>
                <td className="fail">{p.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
