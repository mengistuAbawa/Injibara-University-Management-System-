import { useEffect, useState } from 'react';
import { createCourse, listCourses, updateCourse } from '../../services/hodService';
import './ManageCourses.css';

const empty = {
  course_code: '', course_title: '', credit_hours: 3,
  year_level: 1, semester: 'I', is_elective: false, category: 'Major Course',
};

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const load = () => listCourses().then(setCourses).catch((err) => setMessage(err.response?.data?.message || 'Unable to load courses'));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateCourse(editing.course_id, form);
      else await createCourse(form);
      setMessage(editing ? 'Course updated' : 'Course created');
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to save course');
    }
  };

  const startEdit = (course) => {
    setEditing(course);
    setForm({
      course_code: course.course_code,
      course_title: course.course_title,
      credit_hours: course.credit_hours,
      year_level: course.year_level,
      semester: course.semester,
      is_elective: Boolean(course.is_elective),
      category: course.category || 'Major Course',
    });
  };

  return (
    <div className="hod-courses-page">
      <div className="title-strip">Department Courses</div>
      <form className="hod-course-form" onSubmit={submit}>
        <label>Course code<input required value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} /></label>
        <label>Course title<input required value={form.course_title} onChange={(e) => setForm({ ...form, course_title: e.target.value })} /></label>
        <label>Credit hours<input type="number" min="1" max="10" required value={form.credit_hours} onChange={(e) => setForm({ ...form, credit_hours: Number(e.target.value) })} /></label>
        <label>Year level<select value={form.year_level} onChange={(e) => setForm({ ...form, year_level: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Year {year}</option>)}</select></label>
        <label>Semester<select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}><option>I</option><option>II</option><option>Summer</option></select></label>
        <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Major Course</option><option>Common Course</option><option>Supportive</option></select></label>
        <label className="hod-course-elective"><input type="checkbox" checked={form.is_elective} onChange={(e) => setForm({ ...form, is_elective: e.target.checked })} /> Elective</label>
        <div className="hod-course-actions"><button type="submit">{editing ? 'Save changes' : 'Add course'}</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}</div>
      </form>
      {message && <p className="hod-course-message" role="status">{message}</p>}
      <div className="hod-course-table-wrap"><table className="data-table">
        <thead><tr><th>Code</th><th>Title</th><th>Credits</th><th>Year</th><th>Semester</th><th>Category</th><th>Elective</th><th>Sections</th><th>Actions</th></tr></thead>
        <tbody>{courses.map((course) => <tr key={course.course_id}>
          <td>{course.course_code}</td><td>{course.course_title}</td><td>{course.credit_hours}</td><td>{course.year_level}</td><td>{course.semester}</td><td>{course.category}</td><td>{course.is_elective ? 'Yes' : 'No'}</td><td>{course.section_count}</td>
          <td><button type="button" className="hod-course-edit" onClick={() => startEdit(course)}>Edit</button></td>
        </tr>)}</tbody>
      </table></div>
    </div>
  );
}
