import { useEffect, useState } from 'react';
import { getOverview, listCourses, listInstructors } from '../../services/hodService';
import './DepartmentOverview.css';

export default function DepartmentOverview() {
  const [overview, setOverview] = useState({});
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getOverview(), listCourses(), listInstructors()])
      .then(([summary, courseList, instructorList]) => {
        setOverview(summary);
        setCourses(courseList);
        setInstructors(instructorList);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load department overview'));
  }, []);

  const stats = [
    ['Students', overview.total_students],
    ['Instructors', overview.total_instructors],
    ['Courses', overview.total_courses],
    ['Sections', overview.total_sections],
  ];

  return (
    <div className="hod-ov-page">
      <div className="title-strip">Department Overview{overview.department?.department_name ? ` — ${overview.department.department_name}` : ''}</div>
      {error && <p role="alert">{error}</p>}
      <div className="mini-stats">
        {stats.map(([label, value]) => <div key={label}><strong>{value ?? '—'}</strong><span>{label}</span></div>)}
      </div>
      <h3 className="section-title">Department Instructors</h3>
      <div className="hod-ov-table-wrap"><table className="data-table">
        <thead><tr><th>Name</th><th>Employee No.</th><th>Rank</th><th>Sections</th></tr></thead>
        <tbody>{instructors.map((instructor) => <tr key={instructor.instructor_id}>
          <td>{instructor.first_name} {instructor.last_name}{instructor.is_hod ? ' (HOD)' : ''}</td>
          <td>{instructor.employee_number}</td><td>{instructor.academic_rank || '—'}</td><td>{instructor.section_count}</td>
        </tr>)}</tbody>
      </table></div>
      <h3 className="section-title">Department Courses</h3>
      <div className="hod-ov-table-wrap"><table className="data-table">
        <thead><tr><th>Code</th><th>Title</th><th>Credits</th><th>Year</th><th>Semester</th><th>Category</th><th>Sections</th></tr></thead>
        <tbody>{courses.map((course) => <tr key={course.course_id}>
          <td>{course.course_code}</td><td>{course.course_title}</td><td>{course.credit_hours}</td><td>{course.year_level}</td><td>{course.semester}</td><td>{course.category}</td><td>{course.section_count}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
  );
}
