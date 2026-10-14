import { useEffect, useState } from 'react';
import { getSectionStudents, listSections } from '../../services/registrarService';
import './SectionEnrollments.css';

export default function SectionEnrollments() {
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    listSections().then(setSections).catch(console.error);
  }, []);

  const loadStudents = async (section) => {
    setSelected(section);
    try {
      const data = await getSectionStudents(section.section_id);
      setStudents(data);
    } catch (error) {
      console.error(error);
      setStudents([]);
    }
  };

  return (
    <div className="sec-enr-page">
      <div className="title-strip">Section Enrollments</div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th><th>Title</th><th>Semester</th>
            <th>Year</th><th>Instructor</th>
            <th>Enrolled</th><th></th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr
              key={s.section_id}
              className={selected?.section_id === s.section_id ? 'selected' : ''}
            >
              <td>{s.course_code}</td>
              <td>{s.course_title}</td>
              <td>{s.semester}</td>
              <td>{s.academic_year}</td>
              <td>{s.instructor || '—'}</td>
              <td>{s.enrolled} / {s.capacity}</td>
              <td>
                <button onClick={() => loadStudents(s)}>View Students</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <>
          <h3 className="section-title">
            Students in {selected.course_code} — {selected.course_title}
          </h3>

          {students.length === 0 ? (
            <p className="empty">No students enrolled.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student No.</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.enrollment_id}>
                    <td>{s.student_number}</td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.gender}</td>
                    <td>{s.status}</td>
                    <td>{s.letter_grade || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
