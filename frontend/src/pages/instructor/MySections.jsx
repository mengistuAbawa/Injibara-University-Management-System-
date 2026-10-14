import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMySections } from '../../services/instructorService';
import './MySections.css';

export default function MySections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySections()
      .then(setSections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mysections-page">
      <div className="title-strip">My Sections</div>

      {loading ? (
        <p>Loading…</p>
      ) : sections.length === 0 ? (
        <p className="empty">No sections assigned to you yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Title</th>
              <th>Credit</th>
              <th>Year</th>
              <th>Semester</th>
              <th>Room</th>
              <th>Schedule</th>
              <th>Enrolled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.section_id}>
                <td>{s.course_code}</td>
                <td>{s.course_title}</td>
                <td>{s.credit_hours}</td>
                <td>{s.academic_year}</td>
                <td>{s.semester}</td>
                <td>{s.room}</td>
                <td>{s.schedule}</td>
                <td>{s.enrolled} / {s.capacity}</td>
                <td>
                  <Link to={`/instructor/sections/${s.section_id}`} className="row-btn">
                    Students
                  </Link>
                  <Link to={`/instructor/grades?section=${s.section_id}`} className="row-btn">
                    Grades
                  </Link>
                  <Link to={`/instructor/attendance?section=${s.section_id}`} className="row-btn">
                    Attendance
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}