import { Link, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const dashboardFor = (user) => {
  if (user?.is_hod) return '/hod/dashboard';
  if (user?.role === 'student' && user.status === 'Graduated') return '/alumni/dashboard';
  return ({ admin: '/admin/dashboard', registrar: '/registrar/dashboard', instructor: '/instructor/dashboard', student: '/dashboard', finance: '/finance/dashboard', dean: '/dean/dashboard' })[user?.role];
};

export default function HomePage({ welcomeOnly = false }) {
  const { user } = useAuth();
  const destination = dashboardFor(user);
  if (destination && !welcomeOnly) return <Navigate to={destination} replace />;

  return (
    <div className="welcome-page welcome-home">
      <Header />
      <main className="welcome-main">
        <section className="welcome-hero">
          <p className="welcome-eyebrow">INJIBARA UNIVERSITY</p>
          <h1>Welcome to your university portal</h1>
          <p>Sign in to reach the services and information available for your role.</p>
          <div className="welcome-actions">
            <Link className="welcome-primary" to="/login">Log in</Link>
            <Link className="welcome-secondary" to="/register-account">Register for access</Link>
            <Link className="welcome-secondary" to="/apply">Apply for admission</Link>
            <Link className="welcome-secondary" to="/apply/status">Check application status</Link>
          </div>
        </section>
        <section className="role-grid" aria-label="Portal roles">
          {[
            ['Student', 'View courses, grades, academic status, and field selection.'],
            ['Applicant', 'Submit an admission application and follow its review status.'],
            ['Alumni', 'Request records and documents as a graduated student.'],
            ['Finance officer', 'Manage student fees, invoices, payments, and finance reports.'],
            ['Instructor', 'Manage sections, attendance, and student grades.'],
            ['Registrar', 'Manage student records, enrollment, and results.'],
            ['Department head', 'Review department activity and assign instructors.'],
            ['College dean', 'Review grades and monitor departments, performance, and allocation in your college.'],
            ['Administrator', 'Manage users and university system settings.'],
          ].map(([title, description]) => (
            <article className="role-card" key={title}>
              <h2>{title}</h2><p>{description}</p>
              {title === 'Finance officer' && <Link className="role-request-link" to="/register-account?role=finance">Request Finance access</Link>}
              {title === 'College dean' && <Link className="role-request-link" to="/register-account?role=dean">Request Dean access</Link>}
            </article>
          ))}
        </section>
      </main>
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-brand">
            <strong>Injibara University</strong>
            <span>University Management System</span>
          </div>
          <nav className="welcome-footer-links" aria-label="Footer links">
            <Link to="/">Home</Link>
            <Link to="/login">Log in</Link>
            <Link to="/apply">Admissions</Link>
            <Link to="/apply/status">Application status</Link>
          </nav>
          <p className="welcome-footer-copy">© {new Date().getFullYear()} Injibara University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
