import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function RegistrarLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user || user.role !== 'registrar') return <Navigate to="/login" replace />;
  return (<><Header /><div className="layout"><Sidebar /><main className="content"><Outlet /></main></div></>);
}