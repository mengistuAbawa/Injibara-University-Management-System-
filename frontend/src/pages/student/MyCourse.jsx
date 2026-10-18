import { Fragment, useEffect, useMemo, useState } from 'react';
import { getMyCourses } from '../../services/studentService';
import './MyCourse.css';

const semesterOrder = { I: 1, II: 2, Summer: 3 };

export default function MyCourse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyCourses()
      .then((data) => setCourses(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your assigned courses.'))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const grouped = new Map();
    courses.forEach((course) => {
      const year = Number(course.year_level || 0);
      const semester = course.section_semester || course.semester || 'Unassigned';
      const key = `${year}-${semester}`;
      if (!grouped.has(key)) grouped.set(key, { year, semester, courses: [] });
      grouped.get(key).courses.push(course);
    });
    return [...grouped.values()].sort((a, b) =>
      a.year - b.year || (semesterOrder[a.semester] || 4) - (semesterOrder[b.semester] || 4)
    );
  }, [courses]);

  return (
    <div className="mycourse-page">
      <div className="breadcrumb-bar">My Course</div>
      <div className="title-bar">Courses Assigned to Me</div>
      <p className="mycourse-note">
        Your department assigns courses according to your study year and semester. Contact your department head if an assigned course is missing.
      </p>

      {error && <p className="mycourse-error" role="alert">{error}</p>}

      <div className="grid-container">
        <div className="grid-group-strip">Courses are organized by study year and semester.</div>
        <table className="kendo-grid">
          <thead>
            <tr>
              <th>Course code</th>
              <th>Course title</th>
              <th>Credits</th>
              <th>Category</th>
              <th>Academic year</th>
              <th>Instructor</th>
              <th>Schedule / Room</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="empty-msg">Loading assigned courses...</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan="7" className="empty-msg">No courses have been assigned to your account yet.</td></tr>
            ) : groups.map((group) => (
              <Fragment key={`${group.year}-${group.semester}`}>
                <tr className="course-group-heading">
                  <th colSpan="7">Year {group.year || '—'} · Semester {group.semester}</th>
                </tr>
                {group.courses.map((course, index) => (
                  <tr key={`${course.course_code}-${index}`}>
                    <td>{course.course_code}</td>
                    <td>{course.course_title}</td>
                    <td>{course.credit_hours}</td>
                    <td>{course.category || (course.is_elective ? 'Elective' : 'Core')}</td>
                    <td>{course.academic_year || '—'}</td>
                    <td>{course.instructor || 'Not assigned'}</td>
                    <td>{course.schedule || course.room || 'Not scheduled'}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="copyright-bar">Copyright 2026</div>
    </div>
  );
}
