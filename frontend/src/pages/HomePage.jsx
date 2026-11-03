import { Link, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FiArrowRight, FiBookOpen, FiCheckCircle, FiChevronRight,
  FiGrid, FiHelpCircle, FiHome, FiLogIn, FiMenu, FiShield,
  FiUsers, FiX,
} from 'react-icons/fi';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';
import StudentAppForm from './StudentAppForm';
import './HomePage.css';

const dashboardFor = (user) => {
  if (user?.is_hod) return '/hod/dashboard';
  if (user?.role === 'student' && user.status === 'Graduated') return '/alumni/dashboard';
  return ({ admin: '/admin/dashboard', registrar: '/registrar/dashboard', instructor: '/instructor/dashboard', student: '/dashboard', finance: '/finance/dashboard', dean: '/dean/dashboard' })[user?.role];
};

export default function HomePage({ welcomeOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(new URLSearchParams(location.search).get('login') === '1');
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const openLogin = () => setShowLogin(true);
    window.addEventListener('inu-open-login', openLogin);
    return () => window.removeEventListener('inu-open-login', openLogin);
  }, []);
  const closeLogin = () => setShowLogin(false);
  const destination = dashboardFor(user);
  if (destination && !welcomeOnly) return <Navigate to={destination} replace />;

  return (
    <div className="welcome-page welcome-home">
      <Header />
      <div className="public-shell">
        <aside className={`public-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Public navigation">
          <div className="public-sidebar-top">
            <span>Public portal</span>
            <button type="button" className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><FiX /></button>
          </div>
          <nav className="public-sidebar-nav">
            <Link className="active" to="/public/overview"><FiHome /> Overview</Link>
            <Link to="/public/how-it-works"><FiGrid /> How it works</Link>
            <Link to="/public/user-roles"><FiUsers /> User roles</Link>
            <Link to="/public/login-guide"><FiShield /> Login guide</Link>
            <Link to="/student-application"><FiBookOpen /> Student Application <FiChevronRight /></Link>
            <Link to="/apply"><FiBookOpen /> Admissions <FiChevronRight /></Link>
            <Link to="/apply/status"><FiHelpCircle /> Application status <FiChevronRight /></Link>
          </nav>
          <div className="sidebar-login-card">
            <span className="sidebar-login-icon"><FiLogIn /></span>
            <strong>Ready to continue?</strong>
            <p>Sign in to access your university workspace.</p>
            <button type="button" className="welcome-inline-button" onClick={() => setShowLogin(true)}>Sign in now <FiArrowRight /></button>
          </div>
        </aside>
        {menuOpen && <button className="sidebar-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

        <main className="welcome-main" id="overview">
          <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen(true)}><FiMenu /> Menu</button>
          {pathname === '/student-application' && <StudentAppForm />}
          <section className="welcome-hero">
            <div className="hero-copy">
              <p className="welcome-eyebrow">INJIBARA UNIVERSITY</p>
              <h1>Your university, <span>connected.</span></h1>
              <p>One secure portal for academics, administration, admissions, finance, and university services.</p>
              <div className="welcome-actions">
                <button type="button" className="welcome-primary welcome-inline-button" onClick={() => setShowLogin(true)}>Sign in to portal <FiArrowRight /></button>
                <Link className="welcome-secondary" to="/apply">Apply for admission</Link>
              </div>
            </div>
            <div className="hero-login-card" id="login-guide">
              <div className="hero-card-heading">
                <span><FiLogIn /></span>
                <div><small>PORTAL ACCESS</small><strong>How to login</strong></div>
              </div>
              <ol>
                <li><span>1</span><p><strong>Open the login page</strong>Select “Sign in to portal”.</p></li>
                <li><span>2</span><p><strong>Enter your credentials</strong>Use the username and password issued by your office.</p></li>
                <li><span>3</span><p><strong>Access your workspace</strong>You will be directed to services assigned to your role.</p></li>
              </ol>
              <button type="button" className="hero-card-link welcome-inline-button" onClick={() => setShowLogin(true)}>Go to login <FiArrowRight /></button>
            </div>
          </section>

          <section className="how-section" id="how-it-works">
            <div className="section-heading">
              <div><p className="welcome-eyebrow">SIMPLE & SECURE</p><h2>How the system works</h2></div>
              <p>Each role receives a focused workspace built around university responsibilities.</p>
            </div>
            <div className="process-grid">
              {[
                ['01', 'Sign in', 'Use your official university account to enter the portal securely.'],
                ['02', 'Open your workspace', 'Your dashboard displays the services assigned to your role.'],
                ['03', 'Complete your task', 'Manage records, courses, applications, grades, or payments online.'],
              ].map(([number, title, description]) => (
                <article className="process-card" key={number}>
                  <span>{number}</span><FiCheckCircle />
                  <h3>{title}</h3><p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="roles-section" id="roles">
            <div className="section-heading">
              <div><p className="welcome-eyebrow">PORTAL COMMUNITY</p><h2>Choose your university role</h2></div>
            </div>
            <div className="role-grid" aria-label="Portal roles">
              {[
                ['Student', 'View courses, grades, academic status, and field selection.'],
                ['Applicant', 'Submit an admission application and follow its review status.'],
                ['Alumni', 'Request records and documents as a graduated student.'],
                ['Finance officer', 'Manage student fees, invoices, payments, and finance reports.'],
                ['Instructor', 'Manage sections, attendance, and student grades.'],
                ['Registrar', 'Manage student records, enrollment, and results.'],
                ['Department head', 'Review department activity and assign instructors.'],
                ['College dean', 'Monitor departments, performance, grades, and allocation.'],
                ['Administrator', 'Manage users and university system settings securely.'],
              ].map(([title, description]) => (
                <article className="role-card" key={title}>
                  <span className="role-card-icon"><FiUsers /></span>
                  <h2>{title}</h2><p>{description}</p>
                  {title === 'Finance officer' && <Link className="role-request-link" to="/register-account?role=finance">Request access <FiArrowRight /></Link>}
                  {title === 'College dean' && <Link className="role-request-link" to="/register-account?role=dean">Request access <FiArrowRight /></Link>}
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-brand">
            <strong>Injibara University</strong>
            <span>University Management System</span>
            <p className="welcome-footer-motto">Explore your creative potential</p>
          </div>
          <nav className="welcome-footer-links" aria-label="Footer links">
            <Link to="/">Home</Link>
            <button type="button" className="welcome-footer-login-button" onClick={() => setShowLogin(true)}>Log in</button>
            <Link to="/apply">Admissions</Link>
            <Link to="/apply/status">Application status</Link>
          </nav>
          <p className="welcome-footer-copy">© {new Date().getFullYear()} Injibara University. All rights reserved.</p>
        </div>
      </footer>
      {showLogin && (
        <div className="welcome-login-overlay" role="dialog" aria-modal="true" aria-label="Portal login">
          <button className="welcome-login-backdrop" type="button" onClick={closeLogin} aria-label="Close login" />
          <LoginPage embedded onCancel={closeLogin} />
        </div>
      )}
    </div>
  );
}
