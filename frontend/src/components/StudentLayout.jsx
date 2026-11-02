import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import PortalFooter from './PortalFooter';

export default function StudentLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  const role = String(user?.role || '').trim().toLowerCase();
  if (!user || role !== 'student') return <Navigate to="/login" replace />;
  if (user.status === 'Graduated') return <Navigate to="/alumni/dashboard" replace />;
  return (<><Header /><div className="layout"><Sidebar /><main className="content"><Outlet /></main></div><PortalFooter /></>);
}
