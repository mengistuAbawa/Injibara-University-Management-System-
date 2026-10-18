/** Authenticated layout for graduated student accounts. */
import { Navigate, Outlet } from 'react-router-dom'; import Header from '../components/Header'; import Sidebar from '../components/Sidebar'; import { useAuth } from '../context/AuthContext';
export default function AlumniLayout(){const {user,loading}=useAuth();if(loading)return <p>Loading…</p>;if(!user||user.role!=='student'||user.status!=='Graduated')return <Navigate to="/login" replace/>;return <><Header/><div className="layout"><Sidebar/><main className="content"><Outlet/></main></div></>;}
