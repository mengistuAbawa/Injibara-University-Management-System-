import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRequests, getProfile } from '../../services/alumniService';
import './AlumniDashboard.css';

const dateText = (value) => value ? new Date(value).toLocaleDateString() : '—';

export default function AlumniDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getProfile(), getMyRequests()])
      .then(([profileData, requestData]) => {
        if (!active) return;
        setProfile(profileData);
        setRequests(requestData.slice(0, 5));
      })
      .catch((cause) => {
        if (active) setError(cause.response?.data?.message || 'Could not load alumni information.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return (
    <section className="alumni-page alumni-dashboard">
      <header className="alumni-title-strip">
        <h1>Welcome back{fullName ? `, ${fullName}` : ''}</h1>
      </header>

      {error && <p className="alumni-error" role="alert">{error}</p>}

      <section className="alumni-info-block" aria-label="Alumni information">
        <div><strong>Student Number</strong><span>{profile?.student_number || '—'}</span></div>
        <div><strong>Department</strong><span>{profile?.department_name || '—'}</span></div>
        <div><strong>Year</strong><span>{profile?.current_year || '—'}</span></div>
        <div><strong>Status</strong><span>{profile?.status || '—'}</span></div>
      </section>

      <h2 className="alumni-section-heading">Quick actions</h2>
      <nav className="alumni-quick-actions" aria-label="Alumni quick actions">
        <Link to="/alumni/request">📄 Request Document</Link>
        <Link to="/alumni/requests">📋 My Requests</Link>
        <Link to="/alumni/transcript">🎓 Transcript</Link>
        <Link to="/alumni/profile">👤 My Profile</Link>
      </nav>

      <section className="alumni-recent-requests">
        <h2 className="alumni-section-heading">Recent Requests</h2>
        {loading ? <p role="status">Loading requests…</p> : (
          <div className="alumni-table-scroll">
            <table className="data-table alumni-table">
              <thead>
                <tr><th>Type</th><th>Status</th><th>Requested</th><th>Ready</th></tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.request_id}>
                    <td>{request.request_type.replaceAll('_', ' ')}</td>
                    <td>{request.status}</td>
                    <td>{dateText(request.requested_at)}</td>
                    <td>{dateText(request.ready_at)}</td>
                  </tr>
                ))}
                {!requests.length && !error && (
                  <tr><td colSpan="4">No requests submitted yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
