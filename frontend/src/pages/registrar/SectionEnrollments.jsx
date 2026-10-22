import { useEffect, useState } from 'react';
import { createSection, getSectionStudents, listDepartmentOfferings, listSections } from '../../services/registrarService';
import './SectionEnrollments.css';

export default function SectionEnrollments() {
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [offeringId, setOfferingId] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [room, setRoom] = useState('');
  const [schedule, setSchedule] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    listSections().then(setSections).catch(console.error);
    listDepartmentOfferings().then(setOfferings).catch((e) => setError(e.response?.data?.message || 'Could not load dean-approved offerings.'));
  }, []);

  const addSection = async (event) => {
    event.preventDefault(); setError(''); setMessage('');
    const offering = offerings.find((item) => String(item.offering_id) === offeringId);
    if (!offering) return setError('Choose an approved course offering.');
    try {
      await createSection({ course_id: offering.course_id, year_level: offering.year_level, academic_year: offering.academic_year, semester: offering.semester, capacity, room, schedule });
      setMessage('Section created from the approved offering.');
      const [sectionRows, offeringRows] = await Promise.all([listSections(), listDepartmentOfferings()]);
      setSections(sectionRows); setOfferings(offeringRows);
    } catch (e) { setError(e.response?.data?.message || 'Could not create section.'); }
  };

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

      <form className="actor-form" onSubmit={addSection}>
        <h2>Create section from Dean offering</h2>
        <label>Approved course offering<select required value={offeringId} onChange={(e) => setOfferingId(e.target.value)}><option value="">Choose course, department, year, and semester</option>{offerings.map((o) => <option key={o.offering_id} value={o.offering_id}>{o.department_name} · {o.course_code} · Year {o.year_level} · {o.academic_year} / {o.semester}</option>)}</select></label>
        <label>Room<input value={room} onChange={(e) => setRoom(e.target.value)} maxLength="20" /></label>
        <label>Schedule<input value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength="100" /></label>
        <label>Capacity<input type="number" min="1" max="1000" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></label>
        {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
        <button type="submit" disabled={!offerings.length}>Create section</button>
      </form>

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
