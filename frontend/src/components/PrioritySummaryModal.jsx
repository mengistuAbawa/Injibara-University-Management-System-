import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPriority } from '../services/studentService';
import './PrioritySummaryModal.css';

export default function PrioritySummaryModal({ onClose }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPriority().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⭐ Priority Summary</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p><strong>Student:</strong> {user?.first_name} {user?.last_name}</p>
          <p><strong>ID:</strong> {user?.student_number}</p>
          {loading ? <p>Loading…</p> : data.length === 0 ? <p>No priority records found.</p> : (
            <table className="priority-table">
              <thead><tr><th>#</th><th>Field</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{row.field_name}</td><td>{row.priority}</td><td>{row.status}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}