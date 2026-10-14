import { useEffect, useState } from 'react';
import {
  listSections, listInstructors, assignInstructor, unassignInstructor, updateSection,
} from '../../services/hodService';
import './AssignInstructor.css';

export default function AssignInstructor() {
  const [sections, setSections] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = () => listSections().then(setSections).catch(console.error);

  useEffect(() => {
    load();
    listInstructors().then(setInstructors).catch(console.error);
  }, []);

  const assign = async (section_id, instructor_id) => {
    if (!instructor_id) return;
    try {
      await assignInstructor({ section_id, instructor_id: Number(instructor_id) });
      setMessage('✅ Instructor assigned');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const unassign = async (sectionId) => {
    if (!window.confirm('Unassign instructor from this section?')) return;
    try {
      await unassignInstructor(sectionId);
      setMessage('✅ Instructor unassigned');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const startEdit = (section) => {
    setEditing(section.section_id);
    setForm({
      academic_year: section.academic_year || '',
      semester: section.semester || 'I',
      room: section.room || '',
      schedule: section.schedule || '',
      capacity: section.capacity || 1,
    });
  };

  const saveEdit = async (sectionId) => {
    try {
      await updateSection(sectionId, form);
      setMessage('Section updated');
      setEditing(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update section');
    }
  };

  return (
    <div className="assign-page">
      <div className="title-strip">Assign Instructor to Sections</div>

      {message && <div className="msg">{message}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th><th>Course</th><th>Year</th><th>Sem</th>
            <th>Enrolled</th><th>Current Instructor</th><th>Assign</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.section_id}>
              <td>{s.course_code}</td>
              <td>{s.course_title}</td>
              <td>{s.academic_year}</td>
              <td>{s.semester}</td>
              <td>{s.enrolled} / {s.capacity}</td>
              <td>{s.instructor_name || '—'}</td>
              <td>
                <select
                  value=""
                  onChange={(e) => assign(s.section_id, e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {instructors.map((i) => (
                    <option key={i.instructor_id} value={i.instructor_id}>
                      {i.first_name} {i.last_name} ({i.academic_rank})
                    </option>
                  ))}
                </select>
                {s.instructor_name && (
                  <button className="mini del" onClick={() => unassign(s.section_id)}>
                    Unassign
                  </button>
                )}
              </td>
              <td>
                {editing === s.section_id ? (
                  <div className="section-edit-form">
                    <label>Year<input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></label>
                    <label>Semester<select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                      <option value="I">I</option><option value="II">II</option><option value="Summer">Summer</option>
                    </select></label>
                    <label>Room<input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></label>
                    <label>Schedule<input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} /></label>
                    <label>Capacity<input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label>
                    <button className="mini" onClick={() => saveEdit(s.section_id)}>Save</button>
                    <button className="mini" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="mini" onClick={() => startEdit(s)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
