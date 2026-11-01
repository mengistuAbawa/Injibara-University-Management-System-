import { useEffect, useState } from 'react';
import { getMyTranscript } from '../../services/alumniService';
import './AlumniTranscript.css';

export default function AlumniTranscript() {
  const [transcript, setTranscript] = useState({ courses: [], cgpa: 0, total_credit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMyTranscript()
      .then((data) => { if (active) setTranscript(data); })
      .catch((cause) => {
        if (active) setError(cause.response?.data?.message || 'Could not load your transcript.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="alumni-page alumni-transcript-page">
      <header className="alumni-title-strip alumni-transcript-title"><h1>My Transcript</h1></header>
      {error && <p className="alumni-error" role="alert">{error}</p>}
      <div className="alumni-transcript-summary">
        <p><strong>CGPA:</strong> {Number(transcript.cgpa).toFixed(2)}</p>
        <p><strong>Total Credit:</strong> {transcript.total_credit}</p>
        <button className="alumni-submit alumni-print-controls" type="button" onClick={() => window.print()}>
          Print Transcript
        </button>
      </div>
      {loading ? <p role="status">Loading transcript…</p> : (
        <div className="alumni-table-scroll">
          <table className="data-table alumni-transcript-table">
            <thead>
              <tr>
                <th>Code</th><th>Course</th><th>Credit</th><th>Year</th>
                <th>Semester</th><th>Mark</th><th>Letter</th><th>Point</th>
              </tr>
            </thead>
            <tbody>
              {transcript.courses.map((course, index) => (
                <tr key={`${course.course_code}-${course.academic_year}-${course.semester}-${index}`}>
                  <td>{course.course_code}</td>
                  <td>{course.course_title}</td>
                  <td>{course.credit_hours}</td>
                  <td>{course.academic_year}</td>
                  <td>{course.semester}</td>
                  <td>{course.total_mark ?? '—'}</td>
                  <td>{course.letter_grade || '—'}</td>
                  <td>{course.grade_point ?? '—'}</td>
                </tr>
              ))}
              {!transcript.courses.length && (
                <tr><td colSpan="8">No course records are available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
