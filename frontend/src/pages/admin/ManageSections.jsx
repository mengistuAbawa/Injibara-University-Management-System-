import { useEffect, useState } from 'react';
import {
  listSections, createSection, updateSection, deleteSection,
  listCourses,
} from '../../services/adminService';
import './ManageSections.css';

const empty = {
  course_id: '', academic_year: '2025/2026',
  semester: 'I', room: '', schedule: '', capacity: 50,
};

export default function ManageSections() {
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => listSections().then(setItems).catch(console.error);

  useEffect(() => {
    load();
    listCourses().then(setCourses).catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateSection(editing.section_id, form);
        setMessage('✅ Section updated');
      } else {
        await createSection(form);
        setMessage('✅ Section created');
      }
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const startEdit = (s) => {
    setEditing(s);
    setForm({
      course_id: s.course_id,
      academic_year: s.academic_year,
      semester: s.semester,
      room: s.room || '',
      schedule: s.schedule || '',
      capacity: s.capacity,
    });
  };

  const del = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await deleteSection(id);
      setMessage('✅ Section deleted');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  return (
    <div className="ms-page">
      <div className="title-strip">Manage Sections</div>

      <form className="section-form" onSubmit={submit}>
        <label>Course
          <select value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: Number(e.target.value) })}
                  required>
            <option value="">-- Select --</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code} — {c.course_title}
              </option>
            ))}
          </select>
        </label>
        <label>Academic Year
          <input value={form.academic_year}
                 onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
        </label>
        <label>Semester
          <select value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            <option>I</option><option>II</option><option>Summer</option>
          </select>
        </label>
        <label>Room
          <input value={form.room}
                 onChange={(e) => setForm({ ...form, room: e.target.value })} />
        </label>
        <label>Schedule
          <input value={form.schedule}
                 onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                 placeholder="Mon 08:00-10:00" />
        </label>
        <label>Capacity
          <input type="number" value={form.capacity}
                 onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        </label>
        <button type="submit" className="create-btn">
          {editing ? '💾 Save' : '➕ Create'}
        </button>
        {editing && (
          <button type="button" className="cancel-btn"
                  onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>
        )}
      </form>

      {message && <div className="msg">{message}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th><th>Title</th><th>Year</th><th>Semester</th>
            <th>Instructor</th><th>Room</th><th>Enrolled</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.section_id}>
              <td>{s.course_code}</td>
              <td>{s.course_title}</td>
              <td>{s.academic_year}</td>
              <td>{s.semester}</td>
              <td>{s.instructor || '—'}</td>
              <td>{s.room}</td>
              <td>{s.enrolled} / {s.capacity}</td>
              <td>
                <button className="mini" onClick={() => startEdit(s)}>Edit</button>
                <button className="mini del" onClick={() => del(s.section_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
