/** College-wide grade upload review queue for the dean. */
import { useEffect, useState } from 'react';
import { listGradeUploads, reviewGradeUpload } from '../../services/deanService';
import './DeanPages.css';
export default function GradeApprovals(){
  const [rows,setRows]=useState([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const load=()=>listGradeUploads().then(setRows).catch((e)=>setError(e.response?.data?.message||'Unable to load grade uploads.'));
  useEffect(()=>{load();},[]);
  const review=async(row,action)=>{let note='';if(action==='approve'&&!window.confirm(`Approve grades for ${row.course_code} ${row.academic_year} semester ${row.semester}?`))return;if(action==='reject'){note=window.prompt('Add a note for the instructor about why this upload was rejected:','')??null;if(note===null)return;}setBusy(true);setError('');try{await reviewGradeUpload(row.section_id,{action,note});setNotice(`Grade upload ${action}d.`);await load();}catch(e){setError(e.response?.data?.message||'Unable to review upload.');}finally{setBusy(false);}};
  return <main className="actor-page dean-page"><div className="title-strip"><h1>Grade Approvals</h1></div><section className="actor-card"><p>Approving a grade upload finalizes its grades and makes them read-only for instructors. Rejected uploads return to the instructor for correction and resubmission.</p>{error&&<p className="dean-error" role="alert">{error}</p>}{notice&&<p className="dean-success" role="status">{notice}</p>}
    <div className="dean-table-wrap"><table className="data-table"><thead><tr><th>Course</th><th>Section</th><th>Instructor</th><th>Term</th><th>Students</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{rows.map((r)=><tr key={r.section_id}><td>{r.course_code} · {r.course_title}</td><td>{r.room||`#${r.section_id}`}</td><td>{r.instructor}</td><td>{r.academic_year} / {r.semester}</td><td>{r.students}</td><td>{new Date(r.submitted_at).toLocaleString()}</td><td><button disabled={busy} onClick={()=>review(r,'approve')}>Approve</button> <button disabled={busy} className="danger" onClick={()=>review(r,'reject')}>Reject</button></td></tr>)}{!rows.length&&<tr><td colSpan="7">No grade uploads are waiting for review.</td></tr>}</tbody></table></div>
  </section></main>;
}
