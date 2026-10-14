import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSection, getSectionStudents } from '../../services/instructorService';
import './SectionStudents.css';

export default function SectionStudents() {
  const { sectionId } = useParams();
  const [section, setSection] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getSection(sectionId).then(setSection).catch(console.error);
    getSectionStudents(sectionId).then(setStudents).catch(console.error);
  }, [sectionId]);

  return (
    <div className="secstud-page">
      <div className="title-strip">
        {section
          ? `${section.course_code} — ${section.course_title} (${section.semester} ${section.academic_year})`
          : 'Loading section…'}
      </div>

      {section && (
        <div className="meta">
          <span><strong>Room:</strong> {section.room}</span>
          <span><strong>Schedule:</strong> {section.schedule}</span>
          <span><strong>Enrolled:</strong> {section.enrolled} / {section.capacity}</span>
          <span>
            <Link to={`/instructor/grades?section=${sectionId}`} className="row-btn">
              ✍️ Enter Grades
            </Link>
            <Link to={`/instructor/attendance?section=${sectionId}`} className="row-btn">
              🗓 Take Attendance
            </Link>
          </span>
        </div>
      )}

      {students.length === 0 ? (
        <p className="empty">No students enrolled in this section.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student No.</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Total</th>
              <th>Letter</th>
              <th>Point</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={s.enrollment_id}>
                <td>{i + 1}</td>
                <td>{s.student_number}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.gender}</td>
                <td>{s.total_mark ?? '—'}</td>
                <td>{s.letter_grade ?? '—'}</td>
                <td>{s.grade_point ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}