import { useEffect, useState } from 'react';
import { getSettings, updateSettings, runAllocation } from '../../services/adminService';
import './SystemSettings.css';

const initial = { current_academic_year: '2025/2026', current_semester: 'I', registration_open: true, field_selection_open: false, field_selection_start: '', field_selection_end: '' };
const localValue = (value) => value ? String(value).replace(' ', 'T').slice(0, 16) : '';

export default function SystemSettings() {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState('');
  useEffect(() => {
    getSettings().then((s) => {
      if (s?.id) setForm({ current_academic_year: s.current_academic_year || '2025/2026', current_semester: s.current_semester || 'I', registration_open: !!s.registration_open, field_selection_open: !!s.field_selection_open, field_selection_start: localValue(s.field_selection_start), field_selection_end: localValue(s.field_selection_end) });
    }).catch((err) => setMessage(err.response?.data?.message || 'Could not load settings'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ ...form, field_selection_start: form.field_selection_start ? `${form.field_selection_start.replace('T', ' ')}:00` : null, field_selection_end: form.field_selection_end ? `${form.field_selection_end.replace('T', ' ')}:00` : null });
      setMessage('Settings saved');
    } catch (err) { setMessage(err.response?.data?.message || 'Could not save settings'); }
  };
  const allocate = async () => {
    if (!window.confirm('Run department allocation and replace the current allocation results?')) return;
    try { const result = await runAllocation(); setMessage(`${result.message}: ${result.assigned} assigned, ${result.unassigned} unassigned`); }
    catch (err) { setMessage(err.response?.data?.message || 'Allocation failed'); }
  };

  return <div className="set-page">
    <div className="title-strip">System Settings</div>
    {message && <div className="msg" role="status">{message}</div>}
    <form onSubmit={submit} className="set-form">
      <label>Current Academic Year<input value={form.current_academic_year} onChange={(e) => setForm({ ...form, current_academic_year: e.target.value })} /></label>
      <label>Current Semester<select value={form.current_semester} onChange={(e) => setForm({ ...form, current_semester: e.target.value })}><option>I</option><option>II</option><option>Summer</option></select></label>
      <label className="chk"><input type="checkbox" checked={form.registration_open} onChange={(e) => setForm({ ...form, registration_open: e.target.checked })} />Course Registration Open</label>
      <label className="chk"><input type="checkbox" checked={form.field_selection_open} onChange={(e) => setForm({ ...form, field_selection_open: e.target.checked })} />Department Selection Open</label>
      <label>Selection opens<input type="datetime-local" value={form.field_selection_start} onChange={(e) => setForm({ ...form, field_selection_start: e.target.value })} /></label>
      <label>Selection closes<input type="datetime-local" value={form.field_selection_end} onChange={(e) => setForm({ ...form, field_selection_end: e.target.value })} /></label>
      <button type="submit" className="create-btn">Save Settings</button>
    </form>
    <h3 className="section-title">Department Allocation</h3>
    <div className="danger-zone"><button className="danger-btn" onClick={allocate}>Run Allocation</button><p className="warn">The engine follows each student's priority list and checks department minimum scores and capacity.</p></div>
  </div>;
}
