import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ResourcePage({ title, endpoint, columns, description, createFields, deleteKey, toggleUsers=false }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [form,setForm]=useState({}); const [notice,setNotice]=useState('');
  const refresh=()=>api.get(endpoint).then(({data})=>setRows(Array.isArray(data)?data:data?[data]:[]));
  const create=async e=>{e.preventDefault();setNotice('');try{await api.post(endpoint,form);setForm({});await refresh();setNotice('Record created.');}catch(err){setNotice(err.response?.data?.message||'Unable to create record.');}};
  const remove=async id=>{if(!window.confirm('Delete this record?'))return;try{await api.delete(`${endpoint}/${id}`);await refresh();}catch(err){setNotice(err.response?.data?.message||'Unable to delete record.');}};
  const toggle=async id=>{try{await api.patch(`${endpoint}/${id}/toggle`);await refresh();}catch(err){setNotice(err.response?.data?.message||'Unable to update user.');}};
  useEffect(() => { let active = true; api.get(endpoint).then(({data}) => { if(active) setRows(Array.isArray(data) ? data : data ? [data] : []); }).catch(e => { if(active) setError(e.response?.data?.message || 'Unable to load this information.'); }).finally(() => { if(active) setLoading(false); }); return () => { active = false; }; }, [endpoint]);
  return <section className="resource-page"><h2>{title}</h2>{description && <p>{description}</p>}{error && <p className="error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{createFields&&<form className="form-card" onSubmit={create}><h3>Add record</h3>{createFields.map(f=><label key={f.name}>{f.label}{f.options?<select required value={form[f.name]||''} onChange={e=>setForm({...form,[f.name]:e.target.value})}><option value="">Choose…</option>{f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input required type={f.type||'text'} value={form[f.name]||''} onChange={e=>setForm({...form,[f.name]:e.target.value})}/>}</label>)}<button className="login-btn">Create</button></form>}{loading ? <p>Loading…</p> : rows.length ? <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}{(deleteKey||toggleUsers)&&<th>Actions</th>}</tr></thead><tbody>{rows.map((row,i)=><tr key={row.id ?? row.user_id ?? row.student_id ?? row.section_id ?? row.course_id ?? i}>{columns.map(c=><td key={c.key}>{String(row[c.key] ?? '—')}</td>)}{(deleteKey||toggleUsers)&&<td>{toggleUsers&&<button type="button" onClick={()=>toggle(row.user_id)}>{row.is_active?'Deactivate':'Activate'}</button>}{deleteKey&&<button type="button" onClick={()=>remove(row[deleteKey])}>Delete</button>}</td>}</tr>)}</tbody></table></div> : !error && <p>No records to display.</p>}</section>;
}
