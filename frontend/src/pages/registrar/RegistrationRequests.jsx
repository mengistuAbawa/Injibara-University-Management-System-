import { useEffect, useState } from 'react';
import {
  getRegistrationRequest,
  listRegistrationRequests,
  reviewRegistrationRequest,
} from '../../services/registrationService';
import './RegistrationRequests.css';

export default function RegistrationRequests() {
  const [status, setStatus] = useState('Pending');
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listRegistrationRequests(status);
      setRequests(data);
      if (selected && !data.some(item => item.request_id === selected.request_id)) setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load registration requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, [status]);

  const openRequest = async (requestId) => {
    setError('');
    try {
      setSelected(await getRegistrationRequest(requestId));
      setNote('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open this request.');
    }
  };

  const review = async (decision) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await reviewRegistrationRequest(selected.request_id, {
        decision,
        registrar_note: note,
      });
      setMessage(result.message);
      setSelected(null);
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not review this request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="registration-requests">
      <div className="title-strip">Student Course Registration Requests</div>
      <p>Review each student's selected sections and approve or reject the request. Approved sections are added to the student's enrollments.</p>

      {error && <div className="review-message error" role="alert">{error}</div>}
      {message && <div className="review-message success" role="status">{message}</div>}

      <label className="request-filter">Show requests
        <select value={status} onChange={event => { setStatus(event.target.value); setSelected(null); }}>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </label>

      <div className="request-layout">
        <section className="request-list" aria-label="Registration requests">
          {loading ? <p>Loading requests…</p> : requests.length === 0 ? <p className="request-empty">No {status.toLowerCase()} requests.</p> : requests.map(request => (
            <button
              className={`request-item ${selected?.request_id === request.request_id ? 'active' : ''}`}
              key={request.request_id}
              onClick={() => openRequest(request.request_id)}
            >
              <strong>{request.first_name} {request.last_name}</strong>
              <span>{request.student_number} · {request.academic_year}</span>
              <span>{request.section_count} section(s) · {new Date(request.submitted_at).toLocaleString()}</span>
              <em>{request.status}</em>
            </button>
          ))}
        </section>

        <section className="request-detail">
          {!selected ? <p className="request-empty">Select a request to view the submitted form.</p> : (
            <>
              <h2>{selected.first_name} {selected.last_name}</h2>
              <dl className="request-student-info">
                <div><dt>Student number</dt><dd>{selected.student_number}</dd></div>
                <div><dt>Academic year</dt><dd>{selected.academic_year}</dd></div>
                <div><dt>Department</dt><dd>{selected.department_name || '—'}</dd></div>
                <div><dt>Phone</dt><dd>{selected.phone_number || '—'}</dd></div>
                <div><dt>Region</dt><dd>{selected.region || '—'}</dd></div>
                <div><dt>Submitted</dt><dd>{new Date(selected.submitted_at).toLocaleString()}</dd></div>
              </dl>
              {selected.student_note && <p className="student-request-note"><strong>Student note:</strong> {selected.student_note}</p>}
              <h3>Requested course sections</h3>
              <div className="review-table-wrap">
                <table className="review-table">
                  <thead><tr><th>Course</th><th>Semester</th><th>Credits</th><th>Schedule / room</th><th>Seats</th></tr></thead>
                  <tbody>{selected.sections.map(section => (
                    <tr key={section.section_id}>
                      <td><strong>{section.course_code}</strong><br />{section.course_title}</td>
                      <td>{section.semester}</td>
                      <td>{section.credit_hours}</td>
                      <td>{section.schedule || section.room || 'Not scheduled'}</td>
                      <td>{section.enrolled}/{section.capacity}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {selected.registrar_note && <p><strong>Registrar note:</strong> {selected.registrar_note}</p>}
              {selected.status === 'Pending' && (
                <>
                  <label className="registrar-note">Response note (optional)
                    <textarea rows="3" maxLength="1000" value={note} onChange={event => setNote(event.target.value)} />
                  </label>
                  <div className="review-actions">
                    <button disabled={saving} className="approve-request" onClick={() => review('Approved')}>{saving ? 'Saving…' : 'Approve and enroll'}</button>
                    <button disabled={saving} className="reject-request" onClick={() => review('Rejected')}>{saving ? 'Saving…' : 'Reject request'}</button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
