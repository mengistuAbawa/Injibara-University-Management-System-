import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';

export default function AssignInstructorSections() {
  const { instructorId } = useParams();
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(null);

  const load = () => api.get(`/registrar/instructors/${instructorId}/sections`)
    .then(({ data }) => setSections(data))
    .catch((err) => setError(err.response?.data?.message || 'Unable to load course sections.'));

  useEffect(() => { load(); }, [instructorId]);

  const assign = async (sectionId) => {
    setSaving(sectionId);
    setError('');
    setNotice('');
    try {
      const { data } = await api.patch(`/registrar/instructors/${instructorId}/sections/${sectionId}`);
      setNotice(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to assign this section.');
    } finally {
      setSaving(null);
    }
  };

  return <section>
    <h2>Assign courses to instructor</h2>
    <p>The instructor account is approved. Assign available course sections in their department.</p>
    {notice && <p role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {!sections.length && !error ? <p>No unassigned course sections are available for this instructor.</p> : null}
    {sections.length > 0 && <div className="table-scroll"><table className="data-table">
      <thead><tr><th>Course</th><th>Academic year</th><th>Semester</th><th>Assignment</th></tr></thead>
      <tbody>{sections.map((section) => <tr key={section.section_id}>
        <td>{section.course_code} — {section.course_title}</td>
        <td>{section.academic_year}</td><td>{section.semester}</td>
        <td>{section.instructor_id ? 'Assigned' : <button disabled={saving === section.section_id} onClick={() => assign(section.section_id)}>
          {saving === section.section_id ? 'Assigning…' : 'Assign to instructor'}
        </button>}</td>
      </tr>)}</tbody>
    </table></div>}
    <p><Link to="/registrar/access-requests">Back to access requests</Link></p>
  </section>;
}
