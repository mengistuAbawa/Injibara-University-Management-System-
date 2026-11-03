import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCostSharingStep2, signCostSharingForm } from '../../services/registrarService';
import { getCurrentCostSharingForm, signCostSharingAgreement } from '../../services/studentService';
import './CostSharingForm.css';

export default function CostSharingFormPage1() {
  const { formId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [advancePaid, setAdvancePaid] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [headName, setHeadName] = useState('');
  const [headSignature, setHeadSignature] = useState('');
  const [signDate, setSignDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'student') {
      getCurrentCostSharingForm().then((form) => {
        if (!form) throw new Error('No cost-sharing form has been submitted.');
        setData({
          form,
          agreement: {
            en: 'I accept the cost-sharing obligation set by Injibara University and agree to comply with the terms of the student service agreement. I confirm that the personal and academic information provided is correct.',
            am: 'የኢንጅባራ ዩኒቨርሲቲን የወጪ መጋራት ግዴታ ተቀብዬ በተማሪ አገልግሎት ስምምነቱ መሠረት እንደምሰማማ እስማማለሁ።',
          },
        });
      }).catch((err) => setError(err.response?.data?.message || err.message));
      return;
    }
    getCostSharingStep2(formId).then(setData).catch((err) => {
      setError(err.response?.data?.message || 'Unable to load the agreement.');
    });
  }, [formId, user?.role]);

  const money = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const total = advancePaid ? Number((17695.95 * 0.90).toFixed(2)) : 17695.95;
  const registrarName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || '';

  const finalize = async () => {
    setError('');
    if (advancePaid && (!receiptNo.trim() || !paymentDate)) {
      setError('Payment date and receipt number are required for advance payment.');
      return;
    }
    try {
      if (user?.role === 'student') {
        await signCostSharingAgreement(formId, { advance_paid: advancePaid, receipt_no: receiptNo, payment_date: paymentDate });
      } else {
        await signCostSharingForm(formId, { advance_paid: advancePaid, receipt_no: receiptNo, payment_date: paymentDate });
      }
      window.print();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to finalize the form.');
    }
  };

  if (error && !data) return <div className="cost-document cost-error">{error}</div>;
  if (!data) return <div className="cost-document">Loading agreement / ስምምነቱን በመጫን ላይ...</div>;

  return (
    <article className="cost-document agreement-page">
      <header className="cost-heading">
        <div>INJIBARA UNIVERSITY / ኢንጅባራ ዩኒቨርሲቲ</div>
        <h1>Student Cost Sharing Agreement / የተማሪ ወጪ መጋራት ስምምነት</h1>
        <h2>Page 1 / ገጽ 1</h2>
      </header>

      {error && <div className="cost-error">{error}</div>}
      <section>
        <h3>Fee Breakdown / የክፍያ ዝርዝር</h3>
        <table className="cost-table">
          <tbody>
            <tr><th>Item / አይነት</th><th>Amount (ETB) / መጠን</th></tr>
            <tr><td>Tuition / ትምህርት ክፍያ</td><td>2,057.95</td></tr>
            <tr><td>Food / ምግብ</td><td>15,000.00</td></tr>
            <tr><td>Boarding / መኝታ</td><td>300.00</td></tr>
            <tr><td>Medical / የጤና</td><td>50.00</td></tr>
            {advancePaid && <tr><td>Advance Discount (10%) / የቅድሚያ ክፍያ ቅናሽ</td><td>-1,769.60</td></tr>}
            <tr className="cost-total"><td>Total / ጠቅላላ</td><td>{money(total)} ETB</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3>Advance Payment / ቅድሚያ ክፍያ</h3>
        <label className="cost-check"><input type="checkbox" checked={advancePaid} onChange={(event) => setAdvancePaid(event.target.checked)} /> I am paying in advance / ቅድሚያ ከፍያለሁ</label>
        {advancePaid && <div className="cost-grid cost-grid-2 advance-fields">
          <label>Payment Date / የክፍያ ቀን<input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></label>
          <label>Receipt No. / ደረሰኝ ቁጥር<input value={receiptNo} onChange={(event) => setReceiptNo(event.target.value)} /></label>
          <p className="cost-note">10% discount will be applied. / 10% ቅናሽ ይተገበራል።</p>
        </div>}
      </section>

      <section className="agreement-text">
        <h3>12-13. Agreement / ስምምነት</h3>
        <p><strong>English:</strong> {data.agreement.en}</p>
        <p><strong>Amharic / አማርኛ:</strong> {data.agreement.am}</p>
        <p>I understand that providing false information may lead to disciplinary action, cancellation of registration, and recovery of the university's incurred costs.</p>
        <p>እውነት ያልሆነ መረጃ ማቅርብ የዲሲፕሊን እርምጃ፣ ምዝገባ መሰረዝ እና በዩኒቨርሲቲ የወጣ ወጪ መመለስ እንደሚያስከትል ተረድቻለሁ።</p>
      </section>

      <section className="signature-grid">
        <div>
          <strong>Received by / ተቀባይ</strong>
          <div className="signature-line">{registrarName}</div>
          <small>Registrar / ሬጅስትራር</small>
        </div>
        <div>
          <strong>Head, Representative of the Institute / የተቋም ተወካይ ኃላፊ</strong>
          <label>Name / ስም<input value={headName} onChange={(event) => setHeadName(event.target.value)} /></label>
          <label>Signature / ፊርማ<input value={headSignature} onChange={(event) => setHeadSignature(event.target.value)} /></label>
          <label>Date / ቀን<input type="date" value={signDate} onChange={(event) => setSignDate(event.target.value)} /></label>
        </div>
      </section>
      <div className="cost-actions no-print"><button type="button" className="primary-button" onClick={finalize}>Finalize & Print / አጠናቅቅና አትም</button></div>
    </article>
  );
}
