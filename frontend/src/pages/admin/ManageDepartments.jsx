import { useEffect, useState } from 'react';
import {
  listDepartments, createDepartment, deleteDepartment, updateDepartment,
  listColleges, createCollege, updateCollege, deleteCollege,
} from '../../services/adminService';
import './ManageDepartments.css';

const empty = { department_name: '', department_code: '', faculty: '', college_id: '', capacity: 50, min_score: 0, is_available_for_selection: true };

export default function ManageDepartments() {
  const [items, setItems] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [collegeForm, setCollegeForm] = useState({ college_name: '', college_code: '' });
  const [editingCollege, setEditingCollege] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => Promise.all([listDepartments(), listColleges()]).then(([d, c]) => { setItems(d); setColleges(c); }).catch(console.error);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateDepartment(editing.department_id, form);
        setMessage('✅ Department updated');
      } else {
        await createDepartment(form);
        setMessage('✅ Department created');
      }
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const startEdit = (d) => {
    setEditing(d);
    setForm({
      department_name: d.department_name,
      department_code: d.department_code,
      faculty: d.faculty || '',
        college_id: d.college_id || '', capacity: d.capacity || 50,
        min_score: d.min_score || 0, is_available_for_selection: !!d.is_available_for_selection,
    });
  };

  const saveCollege = async (e) => {
    e.preventDefault();
    try {
      if (editingCollege) await updateCollege(editingCollege.college_id, collegeForm);
      else await createCollege(collegeForm);
      setCollegeForm({ college_name: '', college_code: '' }); setEditingCollege(null); setMessage('College saved'); load();
    } catch (err) { setMessage(err.response?.data?.message || 'Could not save college'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await deleteDepartment(id);
      setMessage('✅ Department deleted');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  return (
    <div className="md-page">
      <div className="title-strip">Manage Departments</div>

      <h3>Colleges</h3>
      <form className="dep-form" onSubmit={saveCollege}>
        <label>College name<input required value={collegeForm.college_name} onChange={(e) => setCollegeForm({ ...collegeForm, college_name: e.target.value })} /></label>
        <label>College code<input required value={collegeForm.college_code} onChange={(e) => setCollegeForm({ ...collegeForm, college_code: e.target.value })} /></label>
        <button type="submit" className="create-btn">{editingCollege ? 'Save College' : 'Create College'}</button>
        {editingCollege && <button type="button" className="cancel-btn" onClick={() => { setEditingCollege(null); setCollegeForm({ college_name: '', college_code: '' }); }}>Cancel</button>}
      </form>
      <table className="data-table"><thead><tr><th>Name</th><th>Code</th><th>Departments</th><th>Actions</th></tr></thead><tbody>
        {colleges.map((c) => <tr key={c.college_id}><td>{c.college_name}</td><td>{c.college_code}</td><td>{c.department_count}</td><td>
          <button className="mini" onClick={() => { setEditingCollege(c); setCollegeForm({ college_name: c.college_name, college_code: c.college_code }); }}>Edit</button>
          <button className="mini del" onClick={async () => { if (window.confirm('Delete this college?')) { try { await deleteCollege(c.college_id); setMessage('College deleted'); load(); } catch (err) { setMessage(err.response?.data?.message || 'Could not delete college'); } } }}>Delete</button>
        </td></tr>)}
      </tbody></table>

      <h3>Departments</h3>
      <form className="dep-form" onSubmit={submit}>
        <label>Name
          <input
            value={form.department_name}
            onChange={(e) => setForm({ ...form, department_name: e.target.value })}
            required
          />
        </label>
        <label>Code
          <input
            value={form.department_code}
            onChange={(e) => setForm({ ...form, department_code: e.target.value })}
            required
            placeholder="e.g. CoSc"
          />
        </label>
        <label>Faculty
          <input
            value={form.faculty}
            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            placeholder="Faculty of Technology"
          />
        </label>
        <label>College<select value={form.college_id} onChange={(e) => setForm({ ...form, college_id: e.target.value })}><option value="">No college</option>{colleges.map((c) => <option key={c.college_id} value={c.college_id}>{c.college_name}</option>)}</select></label>
        <label>Placement capacity<input type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
        <label>Minimum total score<input type="number" min="0" step="0.01" value={form.min_score} onChange={(e) => setForm({ ...form, min_score: Number(e.target.value) })} /></label>
        <label className="check-label"><input type="checkbox" checked={form.is_available_for_selection} onChange={(e) => setForm({ ...form, is_available_for_selection: e.target.checked })} /> Available for placement selection</label>
        <button type="submit" className="create-btn">
          {editing ? '💾 Save' : '➕ Create'}
        </button>
        {editing && (
          <button
            type="button"
            className="cancel-btn"
            onClick={() => { setEditing(null); setForm(empty); }}
          >
            Cancel
          </button>
        )}
      </form>

      {message && <div className="msg">{message}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Code</th>
            <th>Faculty</th>
            <th>College</th><th>Capacity</th><th>Min score</th><th>Available</th>
            <th>Students</th>
            <th>Instructors</th>
            <th>Courses</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.department_id}>
              <td>{d.department_id}</td>
              <td>{d.department_name}</td>
              <td>{d.department_code}</td>
              <td>{d.faculty || '—'}</td>
              <td>{d.college_name || '—'}</td><td>{d.capacity}</td><td>{d.min_score}</td><td>{d.is_available_for_selection ? 'Yes' : 'No'}</td>
              <td>{d.student_count}</td>
              <td>{d.instructor_count}</td>
              <td>{d.course_count}</td>
              <td>
                <button className="mini" onClick={() => startEdit(d)}>Edit</button>
                <button className="mini del" onClick={() => del(d.department_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
