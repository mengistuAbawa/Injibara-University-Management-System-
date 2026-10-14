import { useEffect, useState } from 'react';
import { getMyGrades } from '../../services/studentService';
import './MyGrade.css';

export default function MyGrade() {
  const [grades, setGrades] = useState([]);
  const [option, setOption] = useState('All Taken Courses');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getMyGrades()
      .then((data) => {
        // backend returns { courses: [...], cgpa } or an array
        const rows = Array.isArray(data) ? data : data?.courses || [];
        setGrades(rows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mygrade-page">
      {/* Blue title strip */}
      <div className="title-strip">
        My Grades (to check if there are unremoved Fs, Is, NGs,... unregistered
        courses, exempted courses, waived courses.....)
      </div>

      {/* Filter row */}
      <div className="filter-row">
        <label className="filter-label">
          Choose Your Option <span className="req">*</span>
        </label>

        <select
          className="option-select"
          value={option}
          onChange={(e) => setOption(e.target.value)}
        >
          <option>All Taken Courses</option>
          <option>Courses with F</option>
          <option>Incomplete (I)</option>
          <option>Not Graded (NG)</option>
          <option>Exempted Courses</option>
          <option>Waived Courses</option>
        </select>

        <button className="search-btn" onClick={load}>
          Search
        </button>
      </div>

      {/* Grid */}
      <div className="grid-wrap">
        <div className="grid-group-strip">
          Drag a column header here to group by that column.
        </div>

        <table className="grade-grid">
          <thead>
            <tr>
              <Th label="CourseCode" />
              <Th label="Course Title" />
              <Th label="Credit" />
              <Th label="Grade" />
              <Th label="Category" />
              <Th label="Remark" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-row">Loading...</td>
              </tr>
            ) : grades.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  There are no records available
                </td>
              </tr>
            ) : (
              grades.map((g, i) => (
                <tr key={i}>
                  <td>{g.course_code}</td>
                  <td>{g.course_title}</td>
                  <td>{g.credit_hours}</td>
                  <td>{g.letter_grade ?? '—'}</td>
                  <td>{g.category ?? 'Major Course'}</td>
                  <td>{g.remark ?? ''}</td>
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

/* --------- Header cell with sort + filter icons --------- */
function Th({ label }) {
  return (
    <th>
      <span className="th-label">{label}</span>
      <span className="th-icons">
        <span className="sort-icon">⬍</span>
        <span className="filter-icon">▼</span>
      </span>
    </th>
  );
}