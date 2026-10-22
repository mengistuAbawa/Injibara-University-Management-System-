/** College dean landing page with college metrics and links to dean workflows. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview } from '../../services/deanService';
import './DeanPages.css';

const actions = [
  ['/dean/departments','Manage departments','Create and update departments in your college.'],
  ['/dean/offerings','Course offerings','Assign courses to departments by year and term.'],
  ['/dean/grade-approvals','Grade approvals','Review instructor grade uploads.'],
  ['/dean/statistics','College statistics','Review GPA, pass rates, and grade distribution.'],
  ['/dean/allocation-results','Allocation results','View students placed in your college.'],
  ['/dean/hods','HOD monitor','Review department head performance.'],
  ['/dean/ng-students','NG students','Find students missing a passing grade.'],
  ['/dean/top-students','Top students','View and export college leaders by GPA.'],
  ['/registrar/sections','Registrar sections','Open the registrar section workspace.'],
];

export default function DeanDashboard() {
  const [overview, setOverview] = useState({});
  const [error, setError] = useState('');
  useEffect(() => { getOverview().then(setOverview).catch((e) => setError(e.response?.data?.message || 'Could not load college overview.')); }, []);
  const metrics = [['Departments',overview.departments],['Students',overview.students],['Instructors',overview.instructors],['Courses',overview.courses],['College GPA',overview.college_gpa ?? overview.average_gpa],['Pass rate',overview.pass_rate == null ? '—' : `${overview.pass_rate}%`],['Pending approvals',overview.pending_approvals]];
  return <main className="actor-page dean-page">
    <div className="title-strip"><h1>{overview.college_name ? `${overview.college_name} Dean Dashboard` : 'College Dean Dashboard'}</h1></div>
    {error && <p className="dean-error" role="alert">{error}</p>}
    <section className="actor-card"><div className="dean-kpis">{metrics.map(([label,value]) => <div className="dean-kpi" key={label}>{label}<strong>{value ?? '—'}</strong></div>)}</div>
      <h2>College tools</h2><div className="dean-action-grid">{actions.map(([to,title,description]) => <Link className="dean-action" to={to} key={to}><strong>{title}</strong><span>{description}</span></Link>)}</div>
    </section>
  </main>;
}
