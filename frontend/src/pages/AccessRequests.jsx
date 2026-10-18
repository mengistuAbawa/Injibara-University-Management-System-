/** Registrar and administrator access-request review, including applicant documents. */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function AccessRequests({ office }) {
  const location = useLocation(); const navigate = useNavigate();
  const endpoint = office === 'registrar' ? '/registrar/access-requests' : '/admin/access-requests';
  const [requests, setRequests] = useState([]); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const refresh = () => api.get(endpoint).then(({ data }) => setRequests(data)).catch((err) => setError(err.response?.data?.message || 'Unable to load access requests.'));
  useEffect(() => { refresh(); }, [location.pathname]);
  const review = async (requestId, decision) => {
    setError(''); setNotice('');
    try {
      const registrar_note = window.prompt(decision === 'reject' ? 'Optional rejection reason:' : 'Optional registrar note:', '') || '';
      const { data } = await api.patch(`${endpoint}/${requestId}`, { decision, registrar_note });
      setNotice(`Request ${decision}d.${data.student_number ? ` Student number: ${data.student_number}. The initial password follows the grandfather-name guideline.` : ''}`); await refresh();
      if (office === 'registrar' && decision === 'approve' && data.instructor_id) navigate(`/registrar/assign-instructor/${data.instructor_id}`);
    } catch (err) { setError(err.response?.data?.message || 'Unable to review request.'); }
  };
  return <section><h2>Pending access requests</h2><p>{office === 'registrar' ? 'Review student, instructor, and department head access requests before creating accounts.' : 'Review pending university account requests.'}</p>
    {notice && <p role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}
    {!requests.length ? <p>No pending requests.</p> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Role</th><th>Applicant</th><th>Username after approval</th><th>Email</th><th>Department / choices</th><th>Applicant details</th><th>Documents</th><th>Submitted</th><th>Review</th></tr></thead>
      <tbody>{requests.map((request) => { const data = request.applicant_data; const applicant = Boolean(request.applicant_id); return <tr key={request.request_id}>
        <td>{request.role === 'head' ? 'Department head' : request.role}</td><td>{data.first_name || request.applicant_first_name} {data.last_name || request.applicant_last_name}</td>
        <td>{applicant ? 'Assigned on approval' : `INU${String(data.student_number || data.employee_number || '').replace(/^INU/i, '').toUpperCase()}`}</td><td>{request.email}</td>
        <td>{applicant ? [request.first_choice_name, request.second_choice_name, request.third_choice_name].filter(Boolean).map((name, i) => <div key={i}>{i+1}. {name}</div>) : data.department_name || data.department_id || '—'}</td>
        <td>{applicant ? <>{request.gender} · {request.date_of_birth}<br/>{request.phone_number} · {request.region}<br/>{request.high_school_name} ({request.high_school_region})<br/>Entrance result: {request.university_entrance_result}</> : '—'}</td>
        <td>{request.transcript_url && <a href={`${API_ORIGIN}${request.transcript_url}`} target="_blank" rel="noreferrer">Transcript</a>} {request.photo_url && <a href={`${API_ORIGIN}${request.photo_url}`} target="_blank" rel="noreferrer">Photo</a>}</td>
        <td>{new Date(request.submitted_at).toLocaleDateString()}</td><td><button type="button" onClick={() => review(request.request_id, 'approve')}>Approve</button> <button type="button" onClick={() => review(request.request_id, 'reject')}>Reject</button></td>
      </tr>; })}</tbody></table></div>}
  </section>;
}
