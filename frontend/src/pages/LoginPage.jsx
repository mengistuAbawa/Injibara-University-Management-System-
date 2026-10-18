import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/authService';
import './LoginPage.css';

function roleRedirect(role, isHod, status) {
  if (isHod) return '/hod/dashboard';
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'registrar': return '/registrar/dashboard';
    case 'instructor': return '/instructor/dashboard';
    case 'student': return status === 'Graduated' ? '/alumni/dashboard' : '/dashboard';
    case 'finance': return '/finance/dashboard';
    default: return '/';
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('rememberUser');
    if (saved) { setUsername(saved); setRemember(true); }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginApi(username, password);
      login(data.token, data.student);
      if (remember) localStorage.setItem('rememberUser', username);
      else localStorage.removeItem('rememberUser');
      navigate(roleRedirect(data.student.role, data.student.is_hod, data.student.status));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <>
      <Header />
      <div className="login-container">
        <h2>User Log In</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. INU1500977" required />
          <small>Use INU followed by your student number or employee number.</small>

          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <div className="remember">
            <input type="checkbox" id="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <label htmlFor="remember">Remember Login</label>
          </div>

          <div className="buttons">
            <button type="submit" className="login-btn">Login</button>
            <button type="button" className="cancel-btn" onClick={() => navigate('/')}>Cancel</button>
          </div>

          <button type="button" className="reset-btn" onClick={() => setResetNotice('Forgot your password? Contact the University Registrar’s Office to verify your identity and reset your account password.')}>Forgot password?</button>
          {resetNotice && <p role="status">{resetNotice}</p>}
        </form>
        <p className="register-prompt">Need portal access? <Link to="/register-account">Register for an account</Link></p>
      </div>
    </>
  );
}
