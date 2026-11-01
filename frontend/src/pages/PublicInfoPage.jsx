import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiChevronRight, FiGrid, FiHelpCircle, FiHome, FiLogIn, FiMenu, FiShield, FiUsers, FiX } from 'react-icons/fi';
import Header from '../components/Header';
import './HomePage.css';

const pages = {
  '/public/overview': {
    eyebrow: 'INJIBARA UNIVERSITY',
    title: 'University portal overview',
    intro: 'A single digital workspace for academic, administrative, admissions, finance, and student services.',
  },
  '/public/how-it-works': {
    eyebrow: 'SYSTEM GUIDE',
    title: 'How the system works',
    intro: 'The university portal organizes each task by role and gives users secure access to the services they need.',
  },
  '/public/user-roles': {
    eyebrow: 'PORTAL COMMUNITY',
    title: 'University user roles',
    intro: 'Every user receives a workspace designed around their responsibilities in the university.',
  },
  '/public/login-guide': {
    eyebrow: 'SECURE ACCESS',
    title: 'How to login',
    intro: 'Follow these steps to enter your assigned university workspace.',
  },
};

const roleCards = [
  ['Student', 'View courses, grades, academic status, fees, and field selection.'],
  ['Applicant', 'Submit an admission application and track its review status.'],
  ['Alumni', 'Request records and documents after graduation.'],
  ['Finance officer', 'Manage fees, invoices, payments, and finance reports.'],
  ['Instructor', 'Manage sections, attendance, class performance, and grades.'],
  ['Registrar', 'Manage student records, enrollment, and published results.'],
  ['Department head', 'Review department activity and assign instructors.'],
  ['College dean', 'Monitor departments, grades, performance, and allocations.'],
  ['Administrator', 'Manage users, university information, and system settings.'],
];

export default function PublicInfoPage() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = pages[pathname];

  const closeMenu = () => setMenuOpen(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="welcome-page welcome-home">
      <Header />
      <div className="public-shell">
        <aside className={`public-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Public navigation">
          <div className="public-sidebar-top">
            <span>Public portal</span>
            <button type="button" className="sidebar-close" onClick={closeMenu} aria-label="Close menu"><FiX /></button>
          </div>
          <nav className="public-sidebar-nav">
            <Link className={pathname === '/public/overview' ? 'active' : ''} to="/public/overview"><FiHome /> Overview</Link>
            <Link className={pathname === '/public/how-it-works' ? 'active' : ''} to="/public/how-it-works"><FiGrid /> How it works</Link>
            <Link className={pathname === '/public/user-roles' ? 'active' : ''} to="/public/user-roles"><FiUsers /> User roles</Link>
            <Link className={pathname === '/public/login-guide' ? 'active' : ''} to="/public/login-guide"><FiShield /> Login guide</Link>
            <Link to="/apply"><FiBookOpen /> Admissions <FiChevronRight /></Link>
            <Link to="/apply/status"><FiHelpCircle /> Application status <FiChevronRight /></Link>
          </nav>
          <div className="sidebar-login-card">
            <span className="sidebar-login-icon"><FiLogIn /></span>
            <strong>Ready to continue?</strong>
            <p>Sign in to access your university workspace.</p>
            <Link to="/login">Sign in now <FiArrowRight /></Link>
          </div>
        </aside>
        {menuOpen && <button className="sidebar-backdrop" type="button" onClick={closeMenu} aria-label="Close navigation" />}

        <main className="welcome-main">
          <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen(true)}><FiMenu /> Menu</button>
          <section className="info-page-header">
            <p className="welcome-eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p>{page.intro}</p>
            <Link className="welcome-primary" to="/login">Sign in to portal <FiArrowRight /></Link>
          </section>

          {pathname === '/public/how-it-works' && (
            <div className="process-grid public-info-grid">
              {[
                ['01', 'Sign in', 'Use your official university account to enter the portal securely.'],
                ['02', 'Open your workspace', 'Your dashboard displays the services assigned to your role.'],
                ['03', 'Complete your task', 'Manage records, courses, applications, grades, or payments online.'],
              ].map(([number, title, description]) => (
                <article className="process-card" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
              ))}
            </div>
          )}

          {pathname === '/public/user-roles' && (
            <div className="role-grid public-info-grid">
              {roleCards.map(([title, description]) => (
                <article className="role-card" key={title}><span className="role-card-icon"><FiUsers /></span><h2>{title}</h2><p>{description}</p></article>
              ))}
            </div>
          )}

          {pathname === '/public/login-guide' && (
            <div className="login-guide-page">
              {[
                ['1', 'Open the login page', 'Select “Sign in to portal” from the dashboard or navigation menu.'],
                ['2', 'Enter your account details', 'Use the username and password issued by your university office.'],
                ['3', 'Review the information shown', 'Check that the name, role, and university services are correct.'],
                ['4', 'Open your workspace', 'You will be redirected automatically to services assigned to your role.'],
              ].map(([number, title, description]) => (
                <article key={number}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></article>
              ))}
              <Link className="hero-card-link" to="/login">Go to login <FiArrowRight /></Link>
            </div>
          )}
        </main>
      </div>
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-brand"><strong>Injibara University</strong><span>University Management System</span></div>
          <nav className="welcome-footer-links" aria-label="Footer links"><Link to="/public/overview">Home</Link><Link to="/login">Log in</Link><Link to="/apply">Admissions</Link></nav>
          <p className="welcome-footer-copy">© {new Date().getFullYear()} Injibara University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
