import { useEffect, useState } from 'react';
import { getMyRequests } from '../../services/alumniService';
import './MyRequests.css';

const dateText = (value) => value ? new Date(value).toLocaleDateString() : '—';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyRequests()
      .then((rows) => { if (active) setRequests(rows); })
      .catch((cause) => {
        if (active) setError(cause.response?.data?.message || 'Could not load your requests.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="alumni-page alumni-requests-page">
      <header className="alumni-title-strip"><h1>My Requests</h1></header>
      {error && <p className="alumni-error" role="alert">{error}</p>}
      {loading ? <p role="status">Loading requests…</p> : requests.length === 0 ? (
        <p className="alumni-empty">No requests submitted yet.</p>
      ) : (
        <div className="alumni-table-scroll">
          <table className="data-table alumni-table">
            <thead>
              <tr><th>#</th><th>Type</th><th>Purpose</th><th>Status</th><th>Requested</th><th>Ready</th></tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.request_id}>
                  <td>{request.request_id}</td>
                  <td>{request.request_type.replaceAll('_', ' ')}</td>
                  <td>
                    {request.purpose || '—'}
                    {request.status === 'Rejected' && request.admin_note && (
                      <p className="alumni-admin-note"><strong>Registrar note:</strong> {request.admin_note}</p>
                    )}
                  </td>
                  <td>{request.status}</td>
                  <td>{dateText(request.requested_at)}</td>
                  <td>{dateText(request.ready_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
