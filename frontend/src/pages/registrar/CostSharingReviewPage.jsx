import { useEffect, useState } from 'react';
import { listCostSharingForms, reviewCostSharingForm } from '../../services/registrarService';
import './CostSharingForm.css';

export default function CostSharingReviewPage() {
  const [forms, setForms] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [reason, setReason] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setForms(await listCostSharingForms(filter));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load cost-sharing submissions.');
    }
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (formId, status) => {
    try {
      await reviewCostSharingForm(formId, { status, rejection_reason: reason[formId] || '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update the submission.');
    }
  };

  return (
    <div className="cost-document">
      <header className="cost-heading">
        <h1>Cost Sharing Review / የወጪ መጋራት ግምገማ</h1>
      </header>
      {error && <div className="cost-error">{error}</div>}
      <label>Status / ሁኔታ
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          {['Pending', 'Approved', 'Rejected', ''].map((status) => <option key={status} value={status}>{status || 'All / ሁሉም'}</option>)}
        </select>
      </label>
      <table className="cost-table">
        <thead><tr><th>Student / ተማሪ</th><th>Category / ምድብ</th><th>Status / ሁኔታ</th><th>Decision / ውሳኔ</th></tr></thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.form_id}>
              <td>{form.student_number} - {form.full_name}</td>
              <td>{form.student_type === 'fresh' ? 'Fresh / አዲስ' : 'Department / ዲፓርትመንት'}</td>
              <td>{form.status}</td>
              <td>
                {form.status === 'Pending' && <div className="cost-grid cost-grid-2">
                  <input aria-label="Rejection reason" placeholder="Rejection reason / የመተው ምክንያት"
                    value={reason[form.form_id] || ''} onChange={(event) => setReason((current) => ({ ...current, [form.form_id]: event.target.value }))} />
                  <button type="button" className="primary-button" onClick={() => review(form.form_id, 'Approved')}>Approve</button>
                  <button type="button" onClick={() => review(form.form_id, 'Rejected')}>Reject</button>
                </div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
