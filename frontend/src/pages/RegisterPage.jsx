import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GmailAddressInput from '../components/GmailAddressInput';
import './HomePage.css';

const blank = { role: 'student', first_name: '', last_name: '', email: '', password: '', student_number: '', grandfather_name: '', employee_number: '', invite_code: '', department_id: '', academic_rank: '', phone_number: '' };
const ranks = ['Graduate Assistant', 'Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'];

export default function RegisterPage() {
  const [form, setForm] = useState(blank);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    api.get('/auth/departments')
      .then(({ data }) => setDepartments(data))
      .catch((requestError) => {
        const serverMessage = requestError.response?.data?.message;
        if (serverMessage) {
          setError(`Could not load departments: ${serverMessage}`);
        } else {
          setError('Could not reach the portal API at localhost:5000. Start the backend and MySQL, then reload this page.');
        }
      });
  }, []);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setSubmitting(true);
    try {
      const { data } = await api.post('/auth/access-requests', { ...form, email: `${form.email.trim()}@gmail.com` });
      if (data.token && data.user) {
        login(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/registrar/dashboard');
        return;
      }
      setNotice(data.message); setForm(blank);
    } catch (err) { setError(err.response?.data?.message || 'Unable to submit your request.'); }
    finally { setSubmitting(false); }
  };
  const isStudent = form.role === 'student';
  const isInstructor = ['instructor', 'head'].includes(form.role);
  return <div className="welcome-page"><Header /><main className="access-card">
    <p className="welcome-eyebrow">PORTAL ACCESS</p><h1>Request an account</h1>
    <p>Choose your university role and complete the matching form. Your account is created only after the appropriate office approves your request.</p>
    {notice ? <div className="request-success" role="status"><h2>Request submitted</h2><p>{notice}</p><Link className="welcome-primary" to="/login">Go to login</Link><button className="request-another" type="button" onClick={() => setNotice('')}>Submit another request</button></div> : <form className="access-form" onSubmit={submit}>
      {error && <p className="error" role="alert">{error}</p>}
      <label>University role<select name="role" value={form.role} onChange={update}><option value="student">Student</option><option value="instructor">Instructor</option><option value="head">Department head</option><option value="registrar">Registrar</option><option value="admin">Administrator</option></select></label>
      <div className="access-fields">
        <label>First name<input name="first_name" value={form.first_name} onChange={update} autoComplete="given-name" required /></label>
        <label>Last name<input name="last_name" value={form.last_name} onChange={update} autoComplete="family-name" required /></label>
      </div>
      <label>Email address<GmailAddressInput name="email" value={form.email} onChange={update} /></label>
      <label>Password (at least 8 characters)<input type="password" name="password" value={form.password} onChange={update} minLength="8" autoComplete="new-password" required /></label>
      {isStudent && <>
        <label>Student number<input name="student_number" value={form.student_number} onChange={update} required /></label>
        <small>Your username after approval will be INU{form.student_number.replace(/^INU/i, '').toUpperCase() || '…'}.</small>
        <label>Grandfather name<input name="grandfather_name" value={form.grandfather_name} onChange={update} required /></label>
      </>}
      {(isStudent || isInstructor) && <label>Department<select name="department_id" value={form.department_id} onChange={update} required><option value="">Choose department</option>{departments.map((department) => <option key={department.department_id} value={department.department_id}>{department.department_name}</option>)}</select></label>}
      {!isStudent && <><label>Employee number<input name="employee_number" value={form.employee_number} onChange={update} required /></label><small>Your username {['registrar', 'admin'].includes(form.role) ? 'will be' : 'after approval will be'} INU{form.employee_number.replace(/^INU/i, '').toUpperCase() || '…'}.</small></>}
      {['registrar', 'admin'].includes(form.role) && <label>{form.role === 'admin' ? 'Admin' : 'Registrar'} invitation code<input type="password" name="invite_code" value={form.invite_code} onChange={update} autoComplete="one-time-code" required /><small>Get this code from the system administrator. A valid code lets you sign in immediately.</small></label>}
      {isInstructor && <label>Academic rank<select name="academic_rank" value={form.academic_rank} onChange={update} required><option value="">Choose rank</option>{ranks.map((rank) => <option key={rank}>{rank}</option>)}</select></label>}
      <label>Phone number (optional)<input type="tel" name="phone_number" value={form.phone_number} onChange={update} /></label>
      <p className="approval-note">{['registrar', 'admin'].includes(form.role) ? `With a valid invitation code, your ${form.role} account is created and you are signed in immediately.` : 'Student, instructor, and department head requests are sent to the Registrar for review.'}</p>
      <button className="welcome-primary request-submit" disabled={submitting}>{submitting ? 'Submitting…' : ['registrar', 'admin'].includes(form.role) ? 'Create account and sign in' : 'Submit access request'}</button>
    </form>}
    <Link to="/" className="back-link">Back to welcome page</Link>
  </main></div>;
}
