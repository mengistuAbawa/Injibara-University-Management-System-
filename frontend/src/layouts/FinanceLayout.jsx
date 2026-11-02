/** Authenticated layout reserved for finance officers. */
import { Navigate, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import PortalFooter from '../components/PortalFooter';

export default function FinanceLayout() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  const role = String(user?.role || '').trim().toLowerCase();
  if (!user || role !== 'finance') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="content"><Outlet /></main>
      </div>
      <PortalFooter />
    </>
  );
}
