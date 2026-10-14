import { useEffect, useMemo, useState } from 'react';
import {
  getMyRegistrationRequest,
  listRegistrationSections,
  submitRegistrationRequest,
} from '../../services/registrationService';
import './CourseRegistration.css';

export default function CourseRegistration() {
  const [sections, setSections] = useState([]);
  const [request, setRequest] = useState(null);
  const [academicYear, setAcademicYear] = useState('');
  const [selected, setSelected] = useState([]);
  const [studentNote, setStudentNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const years = useMemo(
    () => [...new Set(sections.map(section => section.academic_year))].sort().reverse(),
    [sections]
  );
  const visibleSections = sections.filter(section => section.academic_year === academicYear);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [sectionData, requestData] = await Promise.all([
        listRegistrationSections(),
        getMyRegistrationRequest(),
      ]);
      setSections(sectionData);
      setRequest(requestData);
      const availableYears = [...new Set(sectionData.map(section => section.academic_year))].sort().reverse();
      setAcademicYear(requestData?.status === 'Pending' ? requestData.academic_year : (availableYears[0] || ''));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load course registration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleSection = (sectionId) => {
    setSelected(current => current.includes(sectionId)
      ? current.filter(id => id !== sectionId)
      : [...current, sectionId]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const result = await submitRegistrationRequest({
        academic_year: academicYear,
        section_ids: selected,
        student_note: studentNote,
      });
      setMessage(result.message);
      setSelected([]);
      setStudentNote('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your request.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="course-registration"><p>Loading registration form…</p></div>;

  return (
    <div className="course-registration">
      <div className="title-strip">Course Registration Form</div>
      <p className="registration-intro">Choose the course sections you want to take. Your request will be sent to the registrar and your enrollment will be confirmed after approval.</p>

      {request && (
        <section className={`registration-status status-${request.status.toLowerCase()}`}>
          <strong>Latest request: {request.status}</strong>
          <span>Academic year {request.academic_year} · submitted {new Date(request.submitted_at).toLocaleString()}</span>
          {request.registrar_note && <p>Registrar note: {request.registrar_note}</p>}
          {request.sections?.length > 0 && (
            <ul>{request.sections.map(section => <li key={section.section_id}>{section.course_code} — {section.course_title} ({section.semester})</li>)}</ul>
          )}
        </section>
      )}

      {error && <div className="registration-message error" role="alert">{error}</div>}
      {message && <div className="registration-message success" role="status">{message}</div>}

      {request?.status === 'Pending' ? (
        <p className="registration-pending">Your request is waiting for registrar review. You can submit another request after it has been reviewed.</p>
      ) : (
        <form onSubmit={submit}>
          <label className="registration-year">Academic year
            <select value={academicYear} onChange={event => { setAcademicYear(event.target.value); setSelected([]); }} required>
              <option value="">Select academic year</option>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>

          <div className="registration-table-wrap">
            <table className="registration-table">
              <thead><tr><th>Select</th><th>Course</th><th>Semester</th><th>Credits</th><th>Instructor</th><th>Schedule</th><th>Seats</th></tr></thead>
              <tbody>
                {visibleSections.length === 0 ? (
                  <tr><td colSpan="7" className="registration-empty">No sections are available for this academic year.</td></tr>
                ) : visibleSections.map(section => {
                  const full = Number(section.enrolled) >= Number(section.capacity);
                  return (
                    <tr key={section.section_id}>
                      <td><input type="checkbox" aria-label={`Select ${section.course_code}`} checked={selected.includes(section.section_id)} disabled={full} onChange={() => toggleSection(section.section_id)} /></td>
                      <td><strong>{section.course_code}</strong><br />{section.course_title}</td>
                      <td>{section.semester}</td>
                      <td>{section.credit_hours}</td>
                      <td>{section.instructor || 'Not assigned'}</td>
                      <td>{section.schedule || section.room || 'Not scheduled'}</td>
                      <td>{section.enrolled}/{section.capacity}{full ? ' · Full' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <label className="registration-note">Note for registrar (optional)
            <textarea value={studentNote} onChange={event => setStudentNote(event.target.value)} maxLength="1000" rows="3" />
          </label>
          <button className="registration-submit" type="submit" disabled={saving || selected.length === 0 || !academicYear}>
            {saving ? 'Submitting…' : `Submit ${selected.length ? `(${selected.length}) ` : ''}for registrar approval`}
          </button>
        </form>
      )}
    </div>
  );
}
