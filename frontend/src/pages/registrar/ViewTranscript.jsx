import { useState } from 'react';
import { searchStudents, getTranscript } from '../../services/registrarService';
import './ViewTranscript.css';

export default function ViewTranscript() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [data, setData] = useState(null);
  const [studentName, setStudentName] = useState('');

  const search = async () => {
    setStudents(await searchStudents(query));
  };

  const load = async (s) => {
    const result = await getTranscript(s.student_id);
    setData(result);
    setStudentName(`${s.first_name} ${s.last_name} (${s.student_number})`);
  };

  return (
    <div className="tr-page">
      <div className="title-strip">View Transcript</div>

      <div className="search-row">
        <input
          placeholder="Search student number or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button className="search-btn" onClick={search}>Search</button>
      </div>

      {students.length > 0 && (
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Year</th><th></th></tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.student_id}>
                <td>{s.student_number}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.current_year}</td>
                <td><button onClick={() => load(s)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && (
        <>
          <h3 className="tr-title">{studentName}</h3>

          <div className="tr-summary">
            <span><strong>CGPA:</strong> {data.cgpa}</span>
            <span><strong>Total Credit:</strong> {data.total_credit}</span>
            <button className="print-btn" onClick={() => window.print()}>🖨 Print</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th><th>Course</th><th>Credit</th>
                <th>Year</th><th>Semester</th>
                <th>Mark</th><th>Letter</th><th>Point</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.map((c, i) => (
                <tr key={i}>
                  <td>{c.course_code}</td>
                  <td>{c.course_title}</td>
                  <td>{c.credit_hours}</td>
                  <td>{c.academic_year}</td>
                  <td>{c.semester}</td>
                  <td>{c.total_mark ?? '—'}</td>
                  <td>{c.letter_grade ?? '—'}</td>
                  <td>{c.grade_point ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}