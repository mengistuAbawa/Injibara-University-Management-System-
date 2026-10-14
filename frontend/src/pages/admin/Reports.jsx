import { useEffect, useMemo, useState } from 'react';
import { getReport, getLoginLog, getSmsLog } from '../../services/adminService';
import './Reports.css';

const reports = [
  ['allocation', 'Department Allocation'], ['grades', 'Grades'],
  ['students_by_dept', 'Students / Department'], ['instructors_by_dept', 'Instructors / Department'],
  ['enrollment_by_section', 'Enrollment / Section'], ['grade_distribution', 'Grade Distribution'],
  ['login_log', 'Login Log'], ['sms_log', 'SMS Logs'],
];
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export default function Reports() {
  const [tab, setTab] = useState('allocation');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const columns = useMemo(() => data.length ? Object.keys(data[0]) : [], [data]);

  useEffect(() => {
    setError('');
    const load = tab === 'login_log' ? getLoginLog() : tab === 'sms_log' ? getSmsLog() : getReport(tab);
    load.then(setData).catch((err) => { setData([]); setError(err.response?.data?.message || 'Could not load report'); });
  }, [tab]);

  const exportCsv = () => {
    const content = [columns.map(csvCell).join(','), ...data.map((row) => columns.map((key) => csvCell(row[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${tab}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="rep-page">
    <div className="title-strip">System Reports</div>
    <div className="tabs">{reports.map(([id, label]) => <button key={id} className={tab === id ? 'tab active' : 'tab'} onClick={() => setTab(id)}>{label}</button>)}</div>
    <div className="report-actions"><button type="button" onClick={exportCsv} disabled={!data.length}>Export Excel (CSV)</button><button type="button" onClick={() => window.print()} disabled={!data.length}>Print / Save PDF</button></div>
    {error && <p role="alert">{error}</p>}
    <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((col) => <th key={col}>{col.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>
      {data.length ? data.map((row, index) => <tr key={row.log_id || row.sms_log_id || row.result_id || index}>{columns.map((col) => <td key={col}>{row[col] == null ? '—' : String(row[col])}</td>)}</tr>) : <tr><td colSpan={Math.max(1, columns.length)} className="empty-row">{error ? 'Report unavailable' : 'No records'}</td></tr>}
    </tbody></table></div>
  </div>;
}
