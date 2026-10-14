import { useEffect, useState } from 'react';
import {
  listCourses, createCourse, updateCourse, deleteCourse, listDepartments,
} from '../../services/adminService';
import './ManageCourses.css';

const empty = {
  course_code: '', course_title: '', credit_hours: 3,
  department_id: '', year_level: 1, semester: 'I',
  is_elective: false, category: 'Major Course',
};

export default function ManageCourses() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const load = () => listCourses().then(setItems).catch(console.error);

  useEffect(() => {
    load();
    listDepartments().then(setDepartments).catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCourse(editing.course_id, form);
        setMessage('✅ Course updated');
      } else {
        await createCourse(form);
        setMessage('✅ Course created');
      }
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const startEdit = (c) => {
    setEditing(c);
    setForm({
      course_code: c.course_code,
      course_title: c.course_title,
      credit_hours: c.credit_hours,
      department_id: c.department_id,
      year_level: c.year_level,
      semester: c.semester,
      is_elective: c.is_elective ? true : false,
      category: c.category || 'Major Course',
    });
  };

  const del = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await deleteCourse(id);
      setMessage('✅ Course deleted');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  return (
    <div className="mc-page">
      <div className="title-strip">Manage Courses</div>

      <form className="course-form" onSubmit={submit}>
        <label>Code
          <input value={form.course_code}
                 onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                 placeholder="SEng4021" required />
        </label>
        <label>Title
          <input value={form.course_title}
                 onChange={(e) => setForm({ ...form, course_title: e.target.value })}
                 required />
        </label>
        <label>Credit
          <input type="number" min="1" max="10" value={form.credit_hours}
                 onChange={(e) => setForm({ ...form, credit_hours: Number(e.target.value) })} />
        </label>
        <label>Department
          <select value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })}
                  required>
            <option value="">-- Select --</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
            ))}
          </select>
        </label>
        <label>Year
          <select value={form.year_level}
                  onChange={(e) => setForm({ ...form, year_level: Number(e.target.value) })}>
            {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </label>
        <label>Semester
          <select value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            <option>I</option><option>II</option><option>Summer</option>
          </select>
        </label>
        <label>Category
          <select value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>Major Course</option>
            <option>Common Course</option>
            <option>Supportive</option>
          </select>
        </label>
        <label className="chk">
          <input type="checkbox" checked={form.is_elective}
                 onChange={(e) => setForm({ ...form, is_elective: e.target.checked })} />
          Elective
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
            <th>Code</th><th>Title</th><th>Credit</th>
            <th>Department</th><th>Year</th><th>Semester</th>
            <th>Category</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.course_id}>
              <td>{c.course_code}</td>
              <td>{c.course_title}</td>
              <td>{c.credit_hours}</td>
              <td>{c.department_name}</td>
              <td>{c.year_level}</td>
              <td>{c.semester}</td>
              <td>{c.category}</td>
              <td>
                <button className="mini" onClick={() => startEdit(c)}>Edit</button>
                <button className="mini del" onClick={() => del(c.course_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}