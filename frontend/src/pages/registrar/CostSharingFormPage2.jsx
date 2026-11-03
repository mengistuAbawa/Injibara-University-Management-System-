import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProfile, submitCostSharingForm } from '../../services/studentService';
import './CostSharingForm.css';

const initial = {
  student_id: '', full_name: '', sex: '', date_of_birth: '', mother_full_name: '',
  region: '', zone: '', woreda: '', city_town: '', phone_number: '', pobox: '',
  highschool_name: '', highschool_completion_date: '',
  college_faculty: 'Engineering & Technology', department: '',
  year_of_attendance: '', current_year: '', withdrawn_date: '', withdrawn_semester: '',
  is_transferred: false, prev_university_name: '', prev_department: '', date_of_transfer: '',
  demand_in_kind: 'none', demand_in_cash: 'none',
};

export default function CostSharingFormPage2() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [studentType, setStudentType] = useState('fresh');

  useEffect(() => {
    getMyProfile().then((profile) => {
      setStudentType(profile.department_name ? 'department' : 'fresh');
      setForm((current) => ({
        ...current,
        full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        sex: profile.gender || '',
        date_of_birth: profile.date_of_birth?.slice(0, 10) || '',
        region: profile.region || '',
        phone_number: profile.phone_number || '',
        current_year: profile.current_year || '',
        department: profile.department_name || '',
      }));
    }).catch(() => setError('Unable to load the student profile.'));
  }, []);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await submitCostSharingForm(form);
      navigate(`/student/cost-sharing/${result.form_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the registration form.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="cost-document" onSubmit={submit}>
      <header className="cost-heading">
        <div>INJIBARA UNIVERSITY / ኢንጅባራ ዩኒቨርሲቲ</div>
        <h1>Student Cost Sharing Registration Form / የተማሪ ወጪ መጋራት ምዝገባ ቅጽ</h1>
        <h2>Page 2: Student Information / ገጽ 2: የተማሪ መረጃ</h2>
      </header>
      {error && <div className="cost-error">{error}</div>}

      <fieldset>
        <legend>1. Student / ተማሪ</legend>
        <div className="cost-grid cost-grid-2">
          <label>Full Name / ሙሉ ስም<input name="full_name" value={form.full_name} onChange={change} required /></label>
          <fieldset className="cost-inline"><legend>Sex / ፆታ</legend>
            {['Male', 'Female'].map((sex) => <label key={sex}><input type="radio" name="sex" value={sex} checked={form.sex === sex} onChange={change} required /> {sex === 'Male' ? 'Male / ወንድ' : 'Female / ሴት'}</label>)}
          </fieldset>
          <label>Date of Birth / የትውልድ ቀን<input type="date" name="date_of_birth" value={form.date_of_birth} onChange={change} /></label>
          <label>Mother's Full Name / የእናት ሙሉ ስም<input name="mother_full_name" value={form.mother_full_name} onChange={change} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>2-4. Address and Contact / አድራሻ እና መገናኛ</legend>
        <div className="cost-grid cost-grid-3">
          <label>Region / ክልል<input name="region" value={form.region} onChange={change} /></label>
          <label>Zone / ዞን<input name="zone" value={form.zone} onChange={change} /></label>
          <label>Woreda / ወረዳ<input name="woreda" value={form.woreda} onChange={change} /></label>
          <label>City / Town / ከተማ<input name="city_town" value={form.city_town} onChange={change} /></label>
          <label>Phone Number / ስልክ<input name="phone_number" value={form.phone_number} onChange={change} /></label>
          <label>P.O. Box / ፖስታ ሳጥን<input name="pobox" value={form.pobox} onChange={change} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>5-6. Academic Information / የትምህርት መረጃ</legend>
        <div className="cost-grid cost-grid-3">
          <label>Highschool Name / የሁለተኛ ደረጃ ት/ቤት<input name="highschool_name" value={form.highschool_name} onChange={change} /></label>
          <label>Completion Date / የምረቃ ቀን<input type="date" name="highschool_completion_date" value={form.highschool_completion_date} onChange={change} /></label>
          <label>Institution / ተቋም<input value="Injibara University / ኢንጅባራ ዩኒቨርሲቲ" readOnly /></label>
          <label>College / Faculty / ኮሌጅ<input name="college_faculty" value={form.college_faculty} readOnly /></label>
          <label>Department / ዲፓርትመንት<input name="department" value={form.department} onChange={change} /></label>
          <label>Year of Attendance / የመግቢያ ዓመት<input type="number" min="1" name="year_of_attendance" value={form.year_of_attendance} onChange={change} /></label>
        </div>
        <fieldset className="cost-inline"><legend>Current Year / የአሁኑ ዓመት</legend>
          {[1,2,3,4,5].map((year) => <label key={year}><input type="radio" name="current_year" value={year} checked={Number(form.current_year) === year} onChange={change} /> {year}</label>)}
        </fieldset>
      </fieldset>

      {studentType === 'department' && <fieldset>
        <legend>7. Withdrawal Information / የማቋረጥ መረጃ</legend>
        <div className="cost-grid cost-grid-2">
          <label>Withdrawal Date / የማቋረጥ ቀን<input type="date" name="withdrawn_date" value={form.withdrawn_date} onChange={change} /></label>
          <label>Semester / ሴሚስተር<input name="withdrawn_semester" value={form.withdrawn_semester} onChange={change} /></label>
        </div>
      </fieldset>}

      {studentType === 'department' && <fieldset>
        <legend>8. Transfer Information / የሽግግር መረጃ</legend>
        <label className="cost-check"><input type="checkbox" name="is_transferred" checked={form.is_transferred} onChange={change} /> Transferred / የተዛወረ</label>
        {form.is_transferred && <div className="cost-grid cost-grid-3">
          <label>Previous University / የቀድሞ ዩኒቨርሲቲ<input name="prev_university_name" value={form.prev_university_name} onChange={change} /></label>
          <label>Previous Department / የቀድሞ ዲፓርትመንት<input name="prev_department" value={form.prev_department} onChange={change} /></label>
          <label>Date of Transfer / የሽግግር ቀን<input type="date" name="date_of_transfer" value={form.date_of_transfer} onChange={change} /></label>
        </div>}
      </fieldset>}

      <fieldset>
        <legend>9. Demanded Services / የሚጠየቁ አገልግሎቶች</legend>
        <div className="cost-grid cost-grid-2">
          <fieldset><legend>In Kind / ዕቃዊ</legend>
            {[['food','Food only / ምግብ ብቻ'],['boarding','Boarding only / መኝታ ብቻ'],['both','Both / ሁለቱም'],['none','None / ምንም']].map(([value,label]) =>
              <label className="cost-check" key={value}><input type="radio" name="demand_in_kind" value={value} checked={form.demand_in_kind === value} onChange={change} /> {label}</label>)}
          </fieldset>
          <fieldset><legend>In Cash / ገንዘባዊ</legend>
            {[['food','Food only / ምግብ ብቻ'],['boarding','Boarding only / መኝታ ብቻ'],['both','Both / ሁለቱም'],['none','None / ምንም']].map(([value,label]) =>
              <label className="cost-check" key={value}><input type="radio" name="demand_in_cash" value={value} checked={form.demand_in_cash === value} onChange={change} /> {label}</label>)}
          </fieldset>
        </div>
      </fieldset>
      <div className="cost-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save & Proceed to Agreement / አስቀምጥና ወደ ስምምነት ቀጥል'}</button></div>
    </form>
  );
}
