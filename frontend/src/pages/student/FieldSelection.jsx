/** Student-facing field preference page with live cutoff and capacity guidance. */
import { useCallback, useEffect, useState } from 'react';
import DepartmentSelectModal from '../../components/DepartmentSelectModal';
import { getMyProfile, getMyFieldPriorities, getFieldSelectionStatus, selectFields } from '../../services/studentService';
import './FieldSelection.css';

export default function FieldSelection() {
  const [profile, setProfile] = useState({});
  const [priorities, setPriorities] = useState([]);
  const [status, setStatus] = useState({ open: false, start: null, end: null });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [student, saved, windowStatus] = await Promise.all([getMyProfile(), getMyFieldPriorities(), getFieldSelectionStatus()]);
      setProfile(student || {});
      setPriorities(saved || []);
      setStatus(windowStatus || { open: false, start: null, end: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load field selection information.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const refreshWindow = () => getFieldSelectionStatus().then(setStatus).catch(() => {});
    const timer = window.setInterval(refreshWindow, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const addPriority = (choice) => {
    setError(''); setMessage('');
    const sameDepartment = priorities.find((item) => Number(item.field_id) === Number(choice.field_id));
    const occupied = priorities.find((item) => Number(item.priority) === Number(choice.priority) && Number(item.field_id) !== Number(choice.field_id));
    if (occupied) { setError(`Priority ${choice.priority} is already used. Choose a free priority.`); return; }
    if (!sameDepartment && priorities.length >= 5) { setError('You can add up to five priorities.'); return; }
    const next = sameDepartment
      ? priorities.map((item) => Number(item.field_id) === Number(choice.field_id) ? { ...item, ...choice } : item)
      : [...priorities, choice];
    setPriorities(next.sort((a, b) => Number(a.priority) - Number(b.priority)));
  };

  const removePriority = (fieldId) => {
    setPriorities((current) => current.filter((item) => Number(item.field_id) !== Number(fieldId)));
    setError(''); setMessage('');
  };

  const submit = async () => {
    if (!priorities.length || busy) return;
    const confirmed = window.confirm(`You are about to submit ${priorities.length} priorities. This cannot be changed after the deadline. Continue?`);
    if (!confirmed) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await selectFields(priorities.map(({ field_id, priority }) => ({ field_id, priority })));
      setMessage(result.message || 'Field priorities submitted successfully.');
      const saved = await getMyFieldPriorities();
      setPriorities(saved || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit field priorities.');
    } finally { setBusy(false); }
  };

  const score = Number(profile.university_entrance_result || 0);
  return <div className="fieldsel-page">
    <div className="title-strip">Department Placement Selection</div>
    {error && <p className="fieldsel-alert" role="alert">{error}</p>}
    {message && <p className="fieldsel-notice" role="status">{message}</p>}
    <div className="info-block">
      <div className="info-grid">
        <div className="info-row"><div className="info-item"><span className="info-label">Full Name:</span><span className="info-value">{profile.full_name || ''}</span></div><div className="info-item"><span className="info-label">Gender:</span><span className="info-value">{profile.gender || ''}</span></div></div>
        <div className="info-row"><div className="info-item"><span className="info-label">Handicapped Case:</span><span className="info-value">{profile.handicapped_case || ''}</span></div><div className="info-item"><span className="info-label">University Entrance Result:</span><span className="info-value">{profile.university_entrance_result != null ? Number(profile.university_entrance_result).toFixed(2) : ''}</span></div></div>
        <div className="info-row"><div className="info-item"><span className="info-label">High School Region:</span><span className="info-value">{profile.highschool_region || ''}</span></div><div className="info-item"><span className="info-label">Current CGPA:</span><span className="info-value">{profile.current_cgpa != null ? Number(profile.current_cgpa).toFixed(2) : ''}</span></div></div>
        <div className="info-row"><div className="info-item"><span className="info-label">Academic Status:</span><span className="info-value">{profile.status || ''}</span></div><div className="info-item"><span className="info-label">Current Program:</span><span className="info-value">{profile.department_name || ''}</span></div></div>
      </div>
    </div>

    <div className="start-strip">
      <div className="fieldsel-start-content">
        <p className="fieldsel-window-message">{loading ? 'Loading field selection window…' : status.open ? 'Field selection is open.' : 'Field selection is currently closed.'}</p>
        {!loading && !status.open && (status.start || status.end) && <p className="fieldsel-window-dates">{status.start && <>Opens: {new Date(status.start).toLocaleString()} </>}{status.end && <>· Closes: {new Date(status.end).toLocaleString()}</>}</p>}
        <button className="start-btn" type="button" onClick={() => { setModalOpen(true); setError(''); setMessage(''); }} disabled={loading || !status.open}>
          Click Here to start Department Selection
        </button>
      </div>
    </div>

    <section className="fieldsel-priorities">
      <div className="fieldsel-priorities-heading"><h2>My Department Priorities</h2><span>{priorities.length} / 5 selected</span></div>
      {priorities.length ? <ol>{[...priorities].sort((a, b) => Number(a.priority) - Number(b.priority)).map((item) => <li key={item.field_id}>
        <span><strong>Priority {item.priority}:</strong> {item.department_name || item.field_name}{item.department_name && item.field_name && item.department_name !== item.field_name ? ` — ${item.field_name}` : ''}{item.college_name ? <small> · {item.college_name}</small> : null}</span>
        <button type="button" className="fieldsel-remove" onClick={() => removePriority(item.field_id)} disabled={!status.open}>Remove</button>
      </li>)}</ol> : <p>No priorities added yet. Choose up to five departments while the selection window is open.</p>}
      <button type="button" className="fieldsel-submit" onClick={submit} disabled={!status.open || !priorities.length || busy}>{busy ? 'Submitting…' : 'Submit My Field Selection'}</button>
    </section>

    <div className="copyright-bar">Copyright 2026</div>
    {modalOpen && <DepartmentSelectModal score={score} priorities={priorities} onAdd={addPriority} onClose={() => setModalOpen(false)} />}
  </div>;
}
