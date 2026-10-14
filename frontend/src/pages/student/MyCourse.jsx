import { useEffect, useState } from 'react';
import { getMyCourses } from '../../services/studentService';
import './MyCourse.css';

export default function MyCourse() {
  const [courses, setCourses] = useState([]);
  const [curriculum, setCurriculum] = useState('Bachelor of Science Degree in Software Engineering');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getMyCourses()
      .then((data) => setCourses(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mycourse-page">
      {/* Breadcrumb strip */}
      <div className="breadcrumb-bar">My Course</div>

      {/* Title strip */}
      <div className="title-bar">
        My Courses (list of courses in my Curriculum...)
      </div>

      {/* Filter row */}
      <div className="filter-row">
        <label className="filter-label">
          Student's Curriculum <span className="req">*</span>
        </label>

        <select
          className="curriculum-select"
          value={curriculum}
          onChange={(e) => setCurriculum(e.target.value)}
        >
          <option>Bachelor of Science Degree in Software Engineering</option>
          <option>Bachelor of Science Degree in Computer Science</option>
          <option>Bachelor of Science Degree in Information Systems</option>
          <option>Bachelor of Science Degree in Information Technology</option>
        </select>

        <button className="search-btn" onClick={load}>
          Search Courses
        </button>
      </div>

      {/* Grid container */}
      <div className="grid-container">
        {/* Kendo-style "drag a column header" strip */}
        <div className="grid-group-strip">
          Drag a column header here to group by that column.
        </div>

        {/* Grid header row */}
        <table className="kendo-grid">
          <thead>
            <tr>
              <th>
                <span className="th-label">Course</span>
                <span className="th-icons">
                  <span className="sort-icon">⬍</span>
                  <span className="filter-icon">▼</span>
                </span>
              </th>
              <th>
                <span className="th-label">Course Title</span>
                <span className="th-icons">
                  <span className="sort-icon">⬍</span>
                  <span className="filter-icon">▼</span>
                </span>
              </th>
              <th>
                <span className="th-label">Credit</span>
                <span className="th-icons">
                  <span className="sort-icon">⬍</span>
                  <span className="filter-icon">▼</span>
                </span>
              </th>
              <th>
                <span className="th-label">Year</span>
                <span className="th-icons">
                  <span className="sort-icon">⬍</span>
                  <span className="filter-icon">▼</span>
                </span>
              </th>
              <th>
                <span className="th-label">Semester</span>
                <span className="th-icons">
                  <span className="sort-icon">⬍</span>
                  <span className="filter-icon">▼</span>
                </span>
              </th>
              <th>
                <span className="th-label">Course Category</span>
                <span className="th-icons">
                  <span className="sort-icon">⬍</span>
                  <span className="filter-icon">▼</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-msg">
                  Loading...
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-msg">
                  There are no records available
                </td>
              </tr>
            ) : (
              courses.map((c, i) => (
                <tr key={i}>
                  <td>{c.course_code}</td>
                  <td>{c.course_title}</td>
                  <td>{c.credit_hours}</td>
                  <td>{c.year_level || c.current_year || '—'}</td>
                  <td>{c.semester || '—'}</td>
                  <td>{c.is_elective ? 'Elective' : 'Core'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Copyright footer */}
      <div className="copyright-bar">Copyright 2026</div>
    </div>
  );
}