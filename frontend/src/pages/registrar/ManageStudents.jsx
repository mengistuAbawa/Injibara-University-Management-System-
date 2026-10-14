import { useState } from 'react';
import { searchStudents, getStudent, updateStudent } from '../../services/registrarService';
import './ManageStudents.css';

export default function ManageStudents() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const search = async () => {
    setStudents(await searchStudents(query));
    setEditing(null);
    setMessage('');
  };

  const openEdit = async (s) => {
    const full = await getStudent(s.student_id);
    setEditing(full);
  };

  const change = (e) => {
    setEditing({ ...editing, [e.target.name]: e.target.value });
  };

  const save = async () => {
    await updateStudent(editing.student_id, editing);
    setMessage('✅ Student updated');
    setEditing(null);
    search();
  };

  return (
    <div className="manage-page">
      <div className="title-strip">Manage Students</div>

      <div className="search-row">
        <input
          placeholder="Search by ID / name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button className="search-btn" onClick={search}>Search</button>
      </div>

      {message && <div className="msg">{message}</div>}

      {students.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Department</th>
              <th>Year</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.student_id}>
                <td>{s.student_number}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.department_name}</td>
                <td>{s.current_year}</td>
                <td>{s.status}</td>
                <td><button onClick={() => openEdit(s)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="edit-box">
          <h3>Editing: {editing.first_name} {editing.last_name}</h3>

          <div className="edit-grid">
            <label>Phone<input name="phone_number" value={editing.phone_number || ''} onChange={change} /></label>
            <label>Region<input name="region" value={editing.region || ''} onChange={change} /></label>
            <label>Current Year
              <select name="current_year" value={editing.current_year || 1} onChange={change}>
                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </label>
            <label>Status
              <select name="status" value={editing.status || 'Active'} onChange={change}>
                <option>Active</option>
                <option>Graduated</option>
                <option>Suspended</option>
                <option>Withdrawn</option>
              </select>
            </label>
            <label>Campus<input name="campus" value={editing.campus || ''} onChange={change} /></label>
            <label>Building<input name="building_name" value={editing.building_name || ''} onChange={change} /></label>
            <label>Dorm<input name="dorm" value={editing.dorm || ''} onChange={change} /></label>
            <label>Bed No.<input name="bed_no" value={editing.bed_no || ''} onChange={change} /></label>
          </div>

          <div className="edit-actions">
            <button className="save-btn" onClick={save}>Save</button>
            <button className="cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}