import { Navigate, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './AlumniLayout.css';

function dashboardFor(user) {
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'registrar') return '/registrar/dashboard';
  if (user.role === 'finance') return '/finance/dashboard';
  if (user.role === 'instructor' && user.is_dean) return '/dean/dashboard';
  if (user.role === 'instructor' && user.is_hod) return '/hod/dashboard';
  if (user.role === 'instructor') return '/instructor/dashboard';
  return '/dashboard';
}

export default function AlumniLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="alumni-loading" role="status">Loading alumni portal…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student') return <Navigate to={dashboardFor(user)} replace />;
  if (user.status !== 'Graduated') return <Navigate to="/dashboard" replace />;

  return (
    <div className="alumni-shell">
      <Header />
      <div className="alumni-layout">
        <Sidebar />
        <main className="alumni-content">
          <Outlet />
        </main>
      </div>
      <footer className="alumni-copyright">© 2026 Injibara University</footer>
    </div>
  );
}
