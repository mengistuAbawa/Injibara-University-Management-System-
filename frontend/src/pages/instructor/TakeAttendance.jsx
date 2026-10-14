import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMySections,
  getSectionStudents,
  saveAttendance,
  getAttendance,
} from '../../services/instructorService';
import './TakeAttendance.css';

export default function TakeAttendance() {
  const [params] = useSearchParams();
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(params.get('section') || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getMySections().then(setSections).catch(console.error);
  }, []);

  /* load students when section changes */
  useEffect(() => {
    if (!sectionId) return;
    getSectionStudents(sectionId).then((data) => {
      setStudents(data);
      const m = {};
      data.forEach((s) => (m[s.enrollment_id] = 'Present'));
      setRecords(m);
      setMessage('');
    });
  }, [sectionId]);

  /* load existing attendance when section or date changes */
  useEffect(() => {
    if (!sectionId || !date) return;
    getAttendance(sectionId, date)
      .then((rows) => {
        if (rows.length === 0) return;
        const m = {};
        rows.forEach((r) => (m[r.enrollment_id] = r.status));
        setRecords((prev) => ({ ...prev, ...m }));
      })
      .catch(() => {});
  }, [sectionId, date]);

  const setStatus = (eid, status) => {
    setRecords((prev) => ({ ...prev, [eid]: status }));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const list = students.map((s) => ({
        enrollment_id: s.enrollment_id,
        status: records[s.enrollment_id] || 'Present',
      }));
      const res = await saveAttendance({ section_id: sectionId, date, records: list });
      setMessage('✅ ' + res.message + ` (${res.count} records)`);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const m = { ...records };
    students.forEach((s) => (m[s.enrollment_id] = status));
    setRecords(m);
  };

  return (
    <div className="att-page">
      <div className="title-strip">Take Attendance</div>

      <div className="filter-row">
        <label>Section
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">-- Select Section --</option>
            {sections.map((s) => (
              <option key={s.section_id} value={s.section_id}>
                {s.course_code} — {s.course_title}
              </option>
            ))}
          </select>
        </label>

        <label>Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <div className="bulk">
          <button className="mini-btn" onClick={() => markAll('Present')}>All Present</button>
          <button className="mini-btn" onClick={() => markAll('Absent')}>All Absent</button>
        </div>
      </div>

      {message && <div className="msg">{message}</div>}

      {students.length > 0 && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student No.</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.enrollment_id}>
                  <td>{i + 1}</td>
                  <td>{s.student_number}</td>
                  <td>{s.first_name} {s.last_name}</td>
                  <td>
                    <select
                      value={records[s.enrollment_id] || 'Present'}
                      onChange={(e) => setStatus(s.enrollment_id, e.target.value)}
                    >
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Late</option>
                      <option>Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="save-btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Attendance'}
          </button>
        </>
      )}

      {sectionId && students.length === 0 && (
        <p className="empty">No students enrolled in this section.</p>
      )}
    </div>
  );
}