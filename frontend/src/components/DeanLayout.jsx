/** Authenticated shell for instructor accounts assigned an active college dean profile. */
import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import './DeanLayout.css';
import PortalFooter from './PortalFooter';

export default function DeanLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  const role = String(user?.role || '').trim().toLowerCase();
  if (!user || role !== 'instructor' || !user.is_dean) return <Navigate to="/instructor/dashboard" replace />;
  return <><Header /><div className="layout dean-layout"><Sidebar /><main className="content"><Outlet /></main></div><PortalFooter /></>;
}
