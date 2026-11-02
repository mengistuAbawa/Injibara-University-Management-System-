import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/inu-logo.png';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(() => window.localStorage.getItem('inu-theme') === 'dark' ? 'dark' : 'light');
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('inu-theme', nextTheme);
    setTheme(nextTheme);
  };
  const [today] = useState(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));

  return (
    <header className="site-header">
      <div className="brand-bar">
        <img
          src={logo}
          alt="INU Logo"
          className="brand-logo"
          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
        />
        <div className="brand-text">
          <p className="brand-eyebrow">WELCOME TO</p>
          <h1>Injibara University Management System</h1>
        </div>
      </div>

      <div className="nav-bar">
        <span className="date">{today}</span>
        <nav className="nav-links">
          {user && location.pathname !== '/welcome' && <Link className="welcome-back-link" to="/welcome" aria-label="Go to welcome page" title="Go to welcome page">🏠 Welcome</Link>}
          <Link to="/">🏠 Home</Link>
          {!user && <Link to="/welcome?login=1">🔑 Login</Link>}
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'dark'}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </nav>
      </div>
    </header>
  );
}
