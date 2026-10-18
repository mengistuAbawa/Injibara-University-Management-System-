import { useEffect, useState } from 'react';
import api from '../../services/api';
import { updateUser, deleteUser } from '../../services/adminService';
import GmailAddressInput from '../../components/GmailAddressInput';
import './ManageUsers.css';

const initialForm = { email: '', password: '', role: 'registrar', employee_number: '', first_name: '', last_name: '' };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  useEffect(() => {
    Promise.all([api.get('/admin/users'), api.get('/admin/departments')])
      .then(([userResponse, departmentResponse]) => {
        setUsers(userResponse.data);
        setDepartments(departmentResponse.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      await api.post('/admin/users', { ...form, email: `${form.email.trim()}@gmail.com` });
      setForm(initialForm);
      await refresh();
      setNotice(`${form.role === 'instructor' ? 'Instructor' : 'Registrar'} account created. Username: INU${String(form.employee_number).replace(/^INU/i, '').toUpperCase()}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account.');
    }
  };

  const toggle = async (userId) => {
    setError('');
    try {
      await api.patch(`/admin/users/${userId}/toggle`);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update account.');
    }
  };

  const resetPassword = async (user) => {
    const password = window.prompt(`Enter a new password for ${user.username} (at least 8 characters):`);
    if (password === null) return;
    setError(''); setNotice('');
    try {
      await api.post(`/admin/users/${user.user_id}/reset-password`, { password });
      setNotice(`Password updated for ${user.username}.`);
    } catch (err) { setError(err.response?.data?.message || 'Unable to reset password.'); }
  };

  const editUser = async (user) => {
    const first_name = window.prompt('First name', user.first_name || '');
    if (first_name === null) return;
    const last_name = window.prompt('Last name', user.last_name || '');
    if (last_name === null) return;
    const email = window.prompt('Email', user.email);
    if (email === null) return;
    const role = window.prompt('Role (admin, registrar, instructor, student)', user.role);
    if (role === null) return;
    try { await updateUser(user.user_id, { first_name, last_name, email, role }); await refresh(); setNotice('User updated.'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to update user.'); }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.username || user.email}? This also deletes linked student records and removes any instructor assignments from sections.`)) return;
    try { await deleteUser(user.user_id); await refresh(); setNotice('User deleted.'); }
    catch (err) { setError(err.response?.data?.message || 'Unable to delete user.'); }
  };

  return (
    <section className="mu-page">
      <h2>Staff accounts</h2>
      <p>Create registrar and instructor accounts. Their username is INU followed by their employee number.</p>
      {notice && <p className="mu-notice" role="status">{notice}</p>}
      {error && <p className="mu-error" role="alert">{error}</p>}

      <form className="mu-form" onSubmit={create}>
        <h3>Create staff account</h3>
        <label>Email<GmailAddressInput name="email" value={form.email} onChange={update} autoComplete="off" /></label>
        <label>Initial password<input name="password" type="password" minLength="8" autoComplete="new-password" required value={form.password} onChange={update} /></label>
        <label>Role<select name="role" value={form.role} onChange={update}><option value="registrar">Registrar</option><option value="instructor">Instructor</option></select></label>
        {form.role === 'registrar' && <>
          <label>First name<input name="first_name" required value={form.first_name} onChange={update} /></label>
          <label>Last name<input name="last_name" required value={form.last_name} onChange={update} /></label>
          <label>Employee number<input name="employee_number" required value={form.employee_number || ''} onChange={update} /></label>
        </>}

        {form.role === 'instructor' && <>
          <label>Employee number<input name="employee_number" required value={form.employee_number || ''} onChange={update} /></label>
          <label>First name<input name="first_name" required value={form.first_name || ''} onChange={update} /></label>
          <label>Last name<input name="last_name" required value={form.last_name || ''} onChange={update} /></label>
          <label>Academic rank<select name="academic_rank" required value={form.academic_rank || ''} onChange={update}><option value="">Choose rank</option>{['Graduate Assistant', 'Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'].map((rank) => <option key={rank}>{rank}</option>)}</select></label>
          <label>Department<select name="department_id" required value={form.department_id || ''} onChange={update}><option value="">Choose department</option>{departments.map((department) => <option key={department.department_id} value={department.department_id}>{department.department_name}</option>)}</select></label>
          <label>Gender<select name="gender" value={form.gender || ''} onChange={update}><option value="">Prefer not to say</option><option>Male</option><option>Female</option></select></label>
          <label>Phone number<input name="phone_number" type="tel" value={form.phone_number || ''} onChange={update} /></label>
        </>}
        <button type="submit" className="mu-submit">Create account</button>
      </form>

      <h3>Current users</h3>
      {loading ? <p>Loading users…</p> : users.length ? <div className="table-scroll"><table className="data-table">
        <thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user.user_id}><td>{user.user_id}</td><td>{[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}</td><td>{user.username || '—'}</td><td>{user.email}</td><td>{user.role}</td><td>{user.is_active ? 'Active' : 'Inactive'}</td><td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td><td><button type="button" onClick={() => editUser(user)}>Edit</button> <button type="button" onClick={() => toggle(user.user_id)}>{user.is_active ? 'Deactivate' : 'Activate'}</button> <button type="button" onClick={() => resetPassword(user)}>Reset password</button> <button type="button" onClick={() => removeUser(user)}>Delete</button></td></tr>)}</tbody>
      </table></div> : <p>No users found.</p>}
    </section>
  );
}
