/** Dean college analytics with GPA, pass rates, department comparison, and grade distribution. */
import { useEffect, useState } from 'react';
import { getStatistics } from '../../services/deanService';
import './DeanPages.css';
export default function Statistics(){
  const [data,setData]=useState({departments:[],grade_distribution:[]}),[error,setError]=useState('');
  useEffect(()=>{getStatistics().then(setData).catch((e)=>setError(e.response?.data?.message||'Unable to load statistics.'));},[]);
  const max=Math.max(1,...data.departments.map((d)=>Number(d.average_gpa)||0));
  return <main className="actor-page dean-page"><div className="title-strip"><h1>College Statistics</h1></div><section className="actor-card">{error&&<p className="dean-error" role="alert">{error}</p>}
    <div className="dean-kpis">{[['Overall GPA',data.college_gpa],['Pass rate',`${data.pass_rate??0}%`],['Failure rate',`${data.failure_rate??0}%`]].map(([label,value])=><div className="dean-kpi" key={label}>{label}<strong>{value??'—'}</strong></div>)}</div>
    <h2>GPA by department</h2>{data.departments.map((d)=><div className="dean-chart-row" key={d.department_id}><span>{d.department_name}</span><div className="dean-bar"><span style={{width:`${Math.max(0,Math.min(100,100*Number(d.average_gpa||0)/max))}%`}}/></div><strong>{d.average_gpa??'—'}</strong></div>)}
    <h2>Grade distribution</h2><div className="dean-pie-list">{data.grade_distribution.map((g)=><span key={g.letter_grade||'none'}>{g.letter_grade||'No grade'}: {g.count}</span>)}</div>
    <h2>Department failure rate</h2><div className="dean-table-wrap"><table className="data-table"><thead><tr><th>Department</th><th>Average GPA</th><th>Failed grades</th><th>Graded</th><th>Failure rate</th></tr></thead><tbody>{data.departments.map((r)=><tr key={r.department_id}><td>{r.department_name}</td><td>{r.average_gpa??'—'}</td><td>{r.failures}</td><td>{r.graded}</td><td>{r.failure_rate}%</td></tr>)}</tbody></table></div>
  </section></main>;
}
