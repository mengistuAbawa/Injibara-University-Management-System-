/** Authenticated layout reserved for finance officers. */
import { Navigate, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function FinanceLayout() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user || user.role !== 'finance') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="content"><Outlet /></main>
      </div>
    </>
  );
}
