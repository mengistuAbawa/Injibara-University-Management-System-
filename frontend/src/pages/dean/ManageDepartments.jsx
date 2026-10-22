/** College-scoped department creation, editing, and deactivation page for deans. */
import { useEffect, useState } from 'react';
import { createDepartment, listDepartments, updateDepartment } from '../../services/deanService';
import './DeanPages.css';

const empty = { department_name: '', department_code: '', faculty: '', is_available_for_selection: true };
export default function ManageDepartments() {
  const [rows,setRows]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const load=()=>listDepartments().then(setRows).catch((e)=>setError(e.response?.data?.message||'Unable to load departments.'));
  useEffect(()=>{load();},[]);
  const submit=async(e)=>{e.preventDefault();setError('');setNotice('');try{if(editing) await updateDepartment(editing,form);else await createDepartment(form);setForm(empty);setEditing(null);setNotice(editing?'Department updated.':'Department created.');await load();}catch(x){setError(x.response?.data?.message||'Could not save department.');}};
  const edit=(row)=>{setEditing(row.department_id);setForm({department_name:row.department_name,department_code:row.department_code,faculty:row.faculty||'',is_available_for_selection:Boolean(row.is_available_for_selection)});window.scrollTo({top:0,behavior:'smooth'});};
  return <main className="actor-page dean-page"><div className="title-strip"><h1>Departments</h1></div><section className="actor-card">
    <h2>{editing?'Edit department':'Create department'}</h2><form className="dean-form" onSubmit={submit}>
      <label>Department name<input required maxLength="100" value={form.department_name} onChange={(e)=>setForm({...form,department_name:e.target.value})}/></label>
      <label>Department code<input required maxLength="10" value={form.department_code} onChange={(e)=>setForm({...form,department_code:e.target.value})}/></label>
      <label>Faculty<input maxLength="100" value={form.faculty} onChange={(e)=>setForm({...form,faculty:e.target.value})}/></label>
      {editing&&<label>Admission selection<select value={String(form.is_available_for_selection)} onChange={(e)=>setForm({...form,is_available_for_selection:e.target.value==='true'})}><option value="true">Active</option><option value="false">Inactive</option></select></label>}
      <button>{editing?'Save changes':'Create department'}</button>{editing&&<button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(empty);}}>Cancel</button>}
    </form>
    {error&&<p className="dean-error" role="alert">{error}</p>}{notice&&<p className="dean-success" role="status">{notice}</p>}
    <div className="dean-table-wrap"><table className="data-table"><thead><tr><th>Department</th><th>Code</th><th>Students</th><th>Instructors</th><th>Courses</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r)=><tr key={r.department_id}><td>{r.department_name}</td><td>{r.department_code}</td><td>{r.student_count}</td><td>{r.instructor_count}</td><td>{r.course_count}</td><td>{r.is_available_for_selection?'Active':'Inactive'}</td><td><button onClick={()=>edit(r)}>Edit</button></td></tr>)}{!rows.length&&<tr><td colSpan="7">No departments assigned to this college.</td></tr>}</tbody></table></div>
  </section></main>;
}
