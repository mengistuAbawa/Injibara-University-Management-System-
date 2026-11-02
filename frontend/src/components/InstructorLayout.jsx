import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import PortalFooter from './PortalFooter';

export default function InstructorLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  const role = String(user?.role || '').trim().toLowerCase();
  if (user?.is_hod) return <Navigate to="/hod/dashboard" replace />;
  if (!user || role !== 'instructor') return <Navigate to="/login" replace />;
  return (<><Header /><div className="layout"><Sidebar /><main className="content"><Outlet /></main></div><PortalFooter /></>);
}