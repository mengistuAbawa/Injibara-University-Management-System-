import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/inu-logo.png';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="site-header">
      {/* Top strip: logo + titles on light blue banner */}
      <div className="brand-bar">
        <img
          src={logo}
          alt="INU Logo"
          className="brand-logo"
          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
        />
        <div className="brand-text">
<h1>
  <marquee behavior="alternate" direction="p">WELCOME TO</marquee>
</h1>
          <h1> <span>Injibara University </span>Management System</h1>
          
        </div>
      </div>

      {/* Bottom strip: date + nav links on blue bar */}
      <div className="nav-bar">
        <span className="date">{today}</span>
        <nav className="nav-links">
          {user && location.pathname !== '/welcome' && <Link className="welcome-back-link" to="/welcome" aria-label="Back to welcome page" title="Back to welcome page">← Welcome</Link>}
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
