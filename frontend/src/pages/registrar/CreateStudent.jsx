import { useEffect, useState } from 'react';
import api from '../../services/api';
import './CreateStudent.css';

const initialForm = {
  student_number: '',
  first_name: '',
  last_name: '',
  grandfather_name: '',
  gender: 'Male',
  date_of_birth: '',
  phone_number: '',
  region: '',
  department_id: '',
  admission_year: new Date().getFullYear(),
  current_year: 1,
  dormitory: '',
  campus: '',
  building_no: '',
  building_name: '',
  floor: '',
  dorm: '',
  bed_no: '',
  handicapped_case: '',
  university_entrance_result: '',
};

export default function CreateStudent() {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ---------- Load departments ---------- */
  useEffect(() => {
    api
      .get('/departments')
      .then((r) => setDepartments(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load departments'));
  }, []);

  /* ---------- Field change ---------- */
  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------- Preview the auto-generated password rule ---------- */
  const previewPassword = form.grandfather_name
    ? `${form.grandfather_name.toLowerCase().replace(/\s+/g, '')}1234abcd#`
    : 'abebe1234abcd#';

  /* ---------- Submit ---------- */
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);

    try {
      const { data } = await api.post('/registrar/students', form);
      setResult(data);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-student-page">
      {/* Blue title strip */}
      <div className="title-strip">Student Registration</div>

      {/* Success banner */}
      {result && (
        <div className="success-banner" role="status">
          ✅ Student <strong>{result.student_number}</strong> created successfully.
          <div className="temp-pass">
            <strong>Login email:</strong>{' '}
            <code>{result.email}</code>
          </div>
          <div className="temp-pass">
            <strong>Temporary Password:</strong>{' '}
            <code>{result.tempPassword}</code>
          </div>
          <div className="hint">
            The student can sign in with their student number or email and this temporary password.
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && <div className="error-banner">❌ {error}</div>}

      {/* Form */}
      <form onSubmit={submit} className="reg-form">
        {/* ------ Personal Information ------ */}
        <fieldset className="form-section">
          <legend>Personal Information</legend>

          <div className="form-grid">
            <label>
              Student Number <span className="req">*</span>
              <input
                name="student_number"
                value={form.student_number}
                onChange={change}
                placeholder="e.g. INU0800343UR"
                required
              />
            </label>

            <label>
              First Name <span className="req">*</span>
              <input
                name="first_name"
                value={form.first_name}
                onChange={change}
                required
              />
            </label>

            <label>
              Last Name <span className="req">*</span>
              <input
                name="last_name"
                value={form.last_name}
                onChange={change}
                required
              />
            </label>

            <label>
              Grandfather Name <span className="req">*</span>
              <input
                name="grandfather_name"
                value={form.grandfather_name}
                onChange={change}
                placeholder="Used for temp password"
                required
              />
            </label>

            <label>
              Gender <span className="req">*</span>
              <select name="gender" value={form.gender} onChange={change}>
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>

            <label>
              Date of Birth
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={change}
              />
            </label>

            <label>
              Phone Number
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={change}
                placeholder="09XXXXXXXX"
              />
            </label>

            <label>
              Region
              <select name="region" value={form.region} onChange={change}>
                <option value="">-- Select Region --</option>
                <option>Addis Ababa</option>
                <option>Afar</option>
                <option>Amhara</option>
                <option>Benishangul-Gumuz</option>
                <option>Dire Dawa</option>
                <option>Gambella</option>
                <option>Harari</option>
                <option>Oromia</option>
                <option>Sidama</option>
                <option>Somali</option>
                <option>South Ethiopia</option>
                <option>South West Ethiopia</option>
                <option>Tigray</option>
                <option>Central Ethiopia</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* ------ Academic Information ------ */}
        <fieldset className="form-section">
          <legend>Academic Information</legend>

          <div className="form-grid">
            <label>
              Department <span className="req">*</span>
              <select
                name="department_id"
                value={form.department_id}
                onChange={change}
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Admission Year <span className="req">*</span>
              <input
                type="number"
                name="admission_year"
                value={form.admission_year}
                onChange={change}
                min="2000"
                max="2100"
                required
              />
            </label>

            <label>
              Current Year
              <select
                name="current_year"
                value={form.current_year}
                onChange={change}
              >
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>
            </label>

            <label>
              University Entrance Result
              <input
                type="number"
                step="0.01"
                name="university_entrance_result"
                value={form.university_entrance_result}
                onChange={change}
                placeholder="e.g. 550.50"
              />
            </label>

            <label>
              Handicapped Case
              <select
                name="handicapped_case"
                value={form.handicapped_case}
                onChange={change}
              >
                <option value="">None</option>
                <option>Visual</option>
                <option>Hearing</option>
                <option>Physical</option>
                <option>Other</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* ------ Dormitory Information ------ */}
        <fieldset className="form-section">
          <legend>Dormitory Information (Optional)</legend>

          <div className="form-grid">
            <label>
              Campus
              <input name="campus" value={form.campus} onChange={change} />
            </label>
            <label>
              Building No.
              <input name="building_no" value={form.building_no} onChange={change} />
            </label>
            <label>
              Building Name
              <input
                name="building_name"
                value={form.building_name}
                onChange={change}
              />
            </label>
            <label>
              Floor
              <input name="floor" value={form.floor} onChange={change} />
            </label>
            <label>
              Dorm
              <input name="dorm" value={form.dorm} onChange={change} />
            </label>
            <label>
              Bed No.
              <input name="bed_no" value={form.bed_no} onChange={change} />
            </label>
          </div>
        </fieldset>

        {/* ------ Temp password preview ------ */}
        <div className="preview-box">
          <span className="preview-label">Auto-generated temporary password:</span>
          <code>{previewPassword}</code>
        </div>

        {/* ------ Actions ------ */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={submitting || departments.length === 0}>
            {submitting ? 'Creating…' : 'Create Student'}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setForm(initialForm)}
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}
