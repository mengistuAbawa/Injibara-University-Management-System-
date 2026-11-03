import { useEffect, useState } from 'react';
import api from '../services/api';
import './StudentAppForm.css';

const initialForm = {
  email: '', fullName: '', identityNo: '', sex: 'Male', nationality: 'Ethiopian',
  dateOfBirthDay: '', dateOfBirthMonth: '', dateOfBirthYear: '', mothersName: '',
  region: '03', zone: 'Awi Zone', wereda: 'Injibara Zuria', kebele: '01', cityTown: '',
  houseNo: '', phoneNo: '', poBox: '', preparatorySchool: '',
  prepDateCompletedDay: '', prepDateCompletedMonth: '', prepDateCompletedYear: '',
  university: 'Injibara University', faculty: 'Engineering & Technology',
  yearOfEntrance: '', departmentChoice: '', department: 'Information System', yearOfStudy: 'III',
  withdrawnSemester: '', withdrawDateDay: '', withdrawDateMonth: '', withdrawDateYear: '',
  transferredUniversityName: '', transferredCollege: '', transferredDepartment: '',
  transferDateDay: '', transferDateMonth: '', transferDateYear: '', transferSemester: '',
  totalCostFigures: '', totalCostWords: '', serviceDemandInKind: 'Food and Boarding',
  serviceDemandInCash: '', advancePaymentDate: '', advancePaymentMonth: '', advancePaymentYear: '',
  advancePaymentDiscount: '', advancePaymentReceiptNo: '', beneficiarySignature: '',
  signatureDateDay: '', signatureDateMonth: '', signatureDateYear: '',
};

const DateFields = ({ prefix, value, onChange, yearLabel = 'Year' }) => (
  <div className="student-app-date-grid">
    <input aria-label={`${prefix} day`} placeholder="Date" name={`${prefix}Day`} value={value[`${prefix}Day`] || ''} onChange={onChange} />
    <input aria-label={`${prefix} month`} placeholder="Month" name={`${prefix}Month`} value={value[`${prefix}Month`] || ''} onChange={onChange} />
    <input aria-label={`${prefix} year`} placeholder={`${yearLabel}`} name={`${prefix}Year`} value={value[`${prefix}Year`] || ''} onChange={onChange} />
  </div>
);

export default function StudentAppForm() {
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/public/departments').then(({ data }) => setDepartments(data)).catch(() => setError('Could not load departments.'));
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/public/student-application', form);
      setSuccess(`${data.message} Application reference: ${data.request_id}`);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-app-card">
      <div className="student-app-heading">
        <span>Injibara University</span>
        <h1>Beneficiaries Agreement Form</h1>
        <p>የተጠቃሚዎች የውል ቅጽ</p>
      </div>
      {error && <div className="student-app-alert error" role="alert">{error}</div>}
      {success && <div className="student-app-alert success" role="status">{success}</div>}
      <form onSubmit={submit}>
        <fieldset>
          <legend>1. Personal Information / የግል መረጃ</legend>
          <label>Email <input type="email" name="email" value={form.email} onChange={change} required /></label>
          <label>Full Name (including grandfather's name) <input name="fullName" value={form.fullName} onChange={change} required /></label>
          <div className="student-app-grid two">
            <label>Identity No. <input name="identityNo" value={form.identityNo} onChange={change} required /></label>
            <label>Sex <select name="sex" value={form.sex} onChange={change}><option>Male</option><option>Female</option></select></label>
          </div>
          <label>Nationality <input name="nationality" value={form.nationality} onChange={change} /></label>
          <label>Date of Birth
            <DateFields prefix="dateOfBirth" value={form} onChange={change} yearLabel="Year E.C." />
          </label>
          <label>Mother's / Adopter's full name <input name="mothersName" value={form.mothersName} onChange={change} required /></label>
          <div className="student-app-grid two">
            <label>Region <input name="region" value={form.region} onChange={change} /></label>
            <label>Zone <input name="zone" value={form.zone} onChange={change} /></label>
            <label>Wereda <input name="wereda" value={form.wereda} onChange={change} /></label>
            <label>Kebele <input name="kebele" value={form.kebele} onChange={change} /></label>
          </div>
          <div className="student-app-grid three">
            <label>House No. <input name="houseNo" value={form.houseNo} onChange={change} /></label>
            <label>Phone No. <input name="phoneNo" value={form.phoneNo} onChange={change} required /></label>
            <label>P.O. Box <input name="poBox" value={form.poBox} onChange={change} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>5. School Background / የትምህርት ዝግጅት</legend>
          <label>Preparatory school <input name="preparatorySchool" value={form.preparatorySchool} onChange={change} required /></label>
          <label>Date completed <DateFields prefix="prepDateCompleted" value={form} onChange={change} yearLabel="Year E.C." /></label>
        </fieldset>

        <fieldset>
          <legend>6. University / College / Institute</legend>
          <label>University <input name="university" value={form.university} onChange={change} /></label>
          <label>Faculty / College <input name="faculty" value={form.faculty} onChange={change} /></label>
          <div className="student-app-grid two">
            <label>Year of entrance <input name="yearOfEntrance" value={form.yearOfEntrance} onChange={change} required /></label>
            <label>Department applied for
              <select name="departmentChoice" value={form.departmentChoice} onChange={change} required>
                <option value="">Select department</option>
                {departments.map((department) => <option key={department.department_id} value={department.department_id}>{department.department_name}</option>)}
              </select>
            </label>
          </div>
          <label>Department / ትምህርት ክፍል <input name="department" value={form.department} onChange={change} /></label>
          <label>Year of study <select name="yearOfStudy" value={form.yearOfStudy} onChange={change}>{['I', 'II', 'III', 'IV', 'V'].map((year) => <option key={year}>{year}</option>)}</select></label>
        </fieldset>

        <fieldset>
          <legend>7. Withdrawal Information</legend>
          <label>Semester <input name="withdrawnSemester" value={form.withdrawnSemester} onChange={change} /></label>
          <label>Date of withdrawal <DateFields prefix="withdrawDate" value={form} onChange={change} yearLabel="Year E.C." /></label>
        </fieldset>

        <fieldset>
          <legend>8. Transfer Information / Service Cost</legend>
          <label>Name of transferred university / college / institute <input name="transferredUniversityName" value={form.transferredUniversityName} onChange={change} /></label>
          <div className="student-app-grid two">
            <label>College / Faculty <input name="transferredCollege" value={form.transferredCollege} onChange={change} /></label>
            <label>Department <input name="transferredDepartment" value={form.transferredDepartment} onChange={change} /></label>
          </div>
          <label>Date of transfer <DateFields prefix="transferDate" value={form} onChange={change} yearLabel="Year E.C." /></label>
          <label>Transfer semester <input name="transferSemester" value={form.transferSemester} onChange={change} /></label>
          <div className="student-app-grid two">
            <label>Total cost in figures <input name="totalCostFigures" value={form.totalCostFigures} onChange={change} /></label>
            <label>Total cost in words <input name="totalCostWords" value={form.totalCostWords} onChange={change} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>9. What services would you demand?</legend>
          <label>In kind <select name="serviceDemandInKind" value={form.serviceDemandInKind} onChange={change}><option>Food only</option><option>Boarding only</option><option>Food and Boarding</option></select></label>
          <label>In cash <select name="serviceDemandInCash" value={form.serviceDemandInCash} onChange={change}><option value="">-- Select option --</option><option>Food only</option><option>Boarding only</option><option>Food and Boarding</option></select></label>
        </fieldset>

        <fieldset>
          <legend>10. Advance Payment Details</legend>
          <DateFields prefix="advancePayment" value={form} onChange={change} />
          <div className="student-app-grid two">
            <label>Discount <input name="advancePaymentDiscount" value={form.advancePaymentDiscount} onChange={change} /></label>
            <label>Receipt No. <input name="advancePaymentReceiptNo" value={form.advancePaymentReceiptNo} onChange={change} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>12. Agreement / ውል</legend>
          <p>I accept the contractual agreement and the Ethiopian higher education cost-sharing regulations, and agree that payments due after graduation will be paid from my income.</p>
          <label>Beneficiary's signature (type full name) <input name="beneficiarySignature" value={form.beneficiarySignature} onChange={change} required /></label>
          <label>Signature date <DateFields prefix="signatureDate" value={form} onChange={change} /></label>
        </fieldset>

        <button className="student-app-submit" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit application'}</button>
      </form>
    </div>
  );
}
