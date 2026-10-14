import { useEffect, useState } from 'react';
import {
  searchStudents,
  publishResult,
  bulkPublishResults,
} from '../../services/registrarService';
import api from '../../services/api';
import './PublishResults.css';

export default function PublishResults() {
  const [students, setStudents] = useState([]);
  const [fields, setFields] = useState([]);
  const [form, setForm] = useState({ student_id: '', field_id: '', status: 'Assigned' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    searchStudents('').then(setStudents).catch(console.error);
    api.get('/fields').then((r) => setFields(r.data)).catch(console.error);
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await publishResult(form);
      setMessage('✅ Result published');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const bulk = async () => {
    if (!window.confirm('Auto-publish priority-1 for all students?')) return;
    const { message } = await bulkPublishResults();
    setMessage('✅ ' + message);
  };

  return (
    <div className="pub-page">
      <div className="title-strip">Publish Field Placement Results</div>

      {message && <div className="msg">{message}</div>}

      <form onSubmit={submit} className="publish-form">
        <label>Student
          <select name="student_id" value={form.student_id} onChange={change} required>
            <option value="">-- Select Student --</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_number} — {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
        </label>

        <label>Field
          <select name="field_id" value={form.field_id} onChange={change} required>
            <option value="">-- Select Field --</option>
            {fields.map((f) => (
              <option key={f.field_id} value={f.field_id}>{f.field_name}</option>
            ))}
          </select>
        </label>

        <label>Status
          <select name="status" value={form.status} onChange={change}>
            <option>Assigned</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>
        </label>

        <div className="actions">
          <button type="submit" className="submit-btn">Publish Single</button>
          <button type="button" className="bulk-btn" onClick={bulk}>
            Auto-Publish All (Priority 1)
          </button>
        </div>
      </form>
    </div>
  );
}