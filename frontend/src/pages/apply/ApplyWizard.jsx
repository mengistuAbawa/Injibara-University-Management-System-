/** Five-step public admission application wizard. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PersonalInfo from './steps/PersonalInfo'; import HighSchoolInfo from './steps/HighSchoolInfo'; import DepartmentChoices from './steps/DepartmentChoices'; import UploadDocuments from './steps/UploadDocuments'; import ReviewSubmit from './steps/ReviewSubmit';
import './ApplyWizard.css';
const steps=['Personal information','High school','Department choices','Documents','Review'];
const readFile=(file)=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
export default function ApplyWizard(){
 const [step,setStep]=useState(0),[value,setValue]=useState({}),[departments,setDepartments]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false); const navigate=useNavigate();
 useEffect(()=>{api.get('/public/departments').then(r=>setDepartments(r.data)).catch(()=>setError('Could not load departments. Please refresh.'));},[]);
 const change=(key)=>(e)=>{const v=e.target.files?.[0]||e.target.value;setValue(p=>({...p,[key]:v}));};
 const advance=async()=>{setError(''); if(step===0&&['first_name','last_name','grandfather_name','gender','date_of_birth','phone_number','region','email'].some(k=>!value[k]))return setError('Complete all personal information fields.'); if(step===1&&['high_school_name','high_school_region','university_entrance_result'].some(k=>!value[k]))return setError('Complete all high school information fields.'); if(step===2&&[value.first_choice_department,value.second_choice_department,value.third_choice_department].some(v=>!v))return setError('Choose all three department preferences.'); if(step===3&&(!value.transcript||!value.photo))return setError('Upload both required documents.'); if(step<4)return setStep(step+1);
 setBusy(true);try{const payload={...value,transcript:await readFile(value.transcript),photo:await readFile(value.photo)};const {data}=await api.post('/public/apply',payload);navigate('/apply/success',{state:data});}catch(e){setError(e.response?.data?.message||'Application could not be submitted.');}finally{setBusy(false);}};
 const views=[<PersonalInfo value={value} onChange={change}/>,<HighSchoolInfo value={value} onChange={change}/>,<DepartmentChoices value={value} onChange={change} departments={departments}/>,<UploadDocuments value={value} onChange={change}/>,<ReviewSubmit value={value}/>];
 return <main className="actor-page"><div className="title-strip"><h1>Admission Application</h1></div><div className="actor-card"><p>Step {step+1} of 5 · {steps[step]}</p><div className="actor-progress"><span style={{width:`${(step+1)*20}%`}}/></div>{error&&<p className="actor-error" role="alert">{error}</p>}{views[step]}<div className="actor-actions">{step>0&&<button className="actor-button secondary" onClick={()=>setStep(step-1)}>Back</button>}<button className="actor-button" disabled={busy} onClick={advance}>{busy?'Submitting…':step===4?'Submit application':'Continue'}</button></div><Link to="/apply/status">Already applied? Check status</Link></div></main>;
}
