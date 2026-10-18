/** Filterable invoice list with inline payment recording and student statements. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './FinancePages.css';

export default function Invoices() {
  const [rows, setRows] = useState([]); const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ status: '', department_id: '', academic_year: '' }); const [msg, setMsg] = useState('');
  const load = () => api.get('/finance/invoices', { params: Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) }).then((r) => setRows(r.data));
  useEffect(() => { api.get('/departments').then((r) => setDepartments(r.data)); }, []);
  useEffect(() => { load(); }, [filters.status, filters.department_id, filters.academic_year]);
  const pay = async (row) => {
    const amount = window.prompt(`Outstanding ${Number(row.amount_due)-Number(row.amount_paid)}. Payment amount:`); if (!amount) return;
    const method = window.prompt('Payment method: Cash, Bank, Telebirr, CBE Birr, Waiver, Other', 'Cash'); if (!method) return;
    try { const r = await api.post('/finance/payments', { invoice_id: row.invoice_id, amount: Number(amount), method }); setMsg(`Payment recorded. Receipt ${r.data.receipt_number}`); load(); }
    catch (e) { setMsg(e.response?.data?.message || 'Payment failed'); }
  };
  return <main className="actor-page"><div className="title-strip"><h1>Invoices</h1></div><section className="actor-card">
    <div className="actor-actions"><select aria-label="Status filter" value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}><option value="">All statuses</option>{['Unpaid','Partial','Paid','Waived','Overdue'].map((s)=><option key={s}>{s}</option>)}</select>
      <select aria-label="Department filter" value={filters.department_id} onChange={(e)=>setFilters({...filters,department_id:e.target.value})}><option value="">All departments</option>{departments.map((d)=><option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}</select>
      <input aria-label="Academic year filter" placeholder="Academic year" value={filters.academic_year} onChange={(e)=>setFilters({...filters,academic_year:e.target.value})}/><Link className="actor-button" to="/finance/invoices/create">Create invoices</Link></div>
    {msg&&<p>{msg}</p>}<table className="data-table"><thead><tr><th>Invoice</th><th>Student</th><th>Department</th><th>Fee</th><th>Due</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r)=><tr key={r.invoice_id}><td>{r.invoice_number}</td><td>{r.student_number} {r.first_name} {r.last_name}</td><td>{r.department_name}</td><td>{r.fee_name}</td><td>{r.amount_due}</td><td>{r.amount_paid}</td><td>{r.current_status}</td><td><button onClick={()=>pay(r)} disabled={['Paid','Waived'].includes(r.current_status)}>Record payment</button> <Link to={`/finance/students/${r.student_id}`}>Statement</Link></td></tr>)}</tbody></table>
  </section></main>;
}
