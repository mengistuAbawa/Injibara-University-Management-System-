import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return (<><Header /><div className="layout"><Sidebar /><main className="content"><Outlet /></main></div></>);
}