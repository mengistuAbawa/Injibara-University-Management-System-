import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function StudentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = () => api.get('/registrar/accounts/students').then(({ data }) => setAccounts(data));
  useEffect(() => { refresh().catch((err) => setError(err.response?.data?.message || 'Unable to load student accounts.')).finally(() => setLoading(false)); }, []);

  const changePassword = async (account) => {
    const password = window.prompt(`Enter a new password for ${account.username} (at least 8 characters):`);
    if (password === null) return;
    setNotice(''); setError('');
    try {
      await api.patch(`/registrar/accounts/students/${account.user_id}/password`, { password });
      setNotice(`Password updated for ${account.username}.`);
    } catch (err) { setError(err.response?.data?.message || 'Unable to update password.'); }
  };

  return <section>
    <h2>Student accounts and passwords</h2>
    <p>Find a student account by username and reset its password when needed.</p>
    {notice && <p role="status">{notice}</p>}{error && <p className="error" role="alert">{error}</p>}
    {loading ? <p>Loading student accounts…</p> : accounts.length ? <div className="table-scroll"><table className="data-table">
      <thead><tr><th>Student</th><th>Student number</th><th>Username</th><th>Email</th><th>Password</th></tr></thead>
      <tbody>{accounts.map((account) => <tr key={account.user_id}><td>{account.first_name} {account.last_name}</td><td>{account.student_number}</td><td>{account.username}</td><td>{account.email}</td><td><button type="button" onClick={() => changePassword(account)}>Change password</button></td></tr>)}</tbody>
    </table></div> : !error && <p>No student accounts found.</p>}
  </section>;
}
