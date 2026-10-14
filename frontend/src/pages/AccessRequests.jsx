import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AccessRequests({ office }) {
  const location = useLocation();
  const navigate = useNavigate();
  const endpoint = office === 'registrar' ? '/registrar/access-requests' : '/admin/access-requests';
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = () => api.get(endpoint).then(({ data }) => setRequests(data)).catch((err) => setError(err.response?.data?.message || 'Unable to load access requests.'));

  useEffect(() => { refresh(); }, [location.pathname]);

  const review = async (requestId, decision) => {
    setError(''); setNotice('');
    try {
      const { data } = await api.patch(`${endpoint}/${requestId}`, { decision });
      setNotice(`Request ${decision}d.`);
      await refresh();
      if (office === 'registrar' && decision === 'approve' && data.instructor_id) {
        navigate(`/registrar/assign-instructor/${data.instructor_id}`);
      }
    } catch (err) { setError(err.response?.data?.message || 'Unable to review request.'); }
  };

  return <section>
    <h2>Pending access requests</h2>
    <p>{office === 'registrar' ? 'Review student, instructor, and department head access requests before creating accounts.' : 'Review pending university account requests.'}</p>
    {notice && <p role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}
    {!requests.length ? <p>No pending requests.</p> : <div className="table-scroll"><table className="data-table">
      <thead><tr><th>Role</th><th>Applicant</th><th>Username after approval</th><th>Email</th><th>Department</th><th>Submitted</th><th>Review</th></tr></thead>
      <tbody>{requests.map((request) => {
        const data = request.applicant_data;
        return <tr key={request.request_id}>
          <td>{request.role === 'head' ? 'Department head' : request.role}</td>
          <td>{data.first_name} {data.last_name}</td><td>INU{String(data.student_number || data.employee_number || '').replace(/^INU/i, '').toUpperCase()}</td><td>{request.email}</td>
          <td>{data.department_name || data.department_id || '—'}</td>
          <td>{new Date(request.submitted_at).toLocaleDateString()}</td>
          <td><button type="button" onClick={() => review(request.request_id, 'approve')}>Approve</button> <button type="button" onClick={() => review(request.request_id, 'reject')}>Reject</button></td>
        </tr>;
      })}</tbody>
    </table></div>}
  </section>;
}
