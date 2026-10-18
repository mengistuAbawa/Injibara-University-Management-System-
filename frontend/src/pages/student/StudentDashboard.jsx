import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const [outstanding, setOutstanding] = useState(0);
  useEffect(() => { api.get('/students/my-fees').then(({ data }) => setOutstanding(data.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.amount_due) - Number(invoice.amount_paid)), 0))).catch(() => {}); }, []);
  return (
    <>
      <div className="actor-kpi" style={{ margin: '16px 0' }}>Outstanding Balance<strong>{outstanding.toLocaleString()} ETB</strong><Link to="/my-fees">View invoices and payment history</Link></div>
      <div className="dash-layout">
        <main className="dash-main">
          <div className="notice-strip">
            Read the following information carefully....
          </div>

          <h2 className="greeting">Dear Injibara University Students,</h2>

          <p className="link-line">
            To follow-up your grade and related information {' '}
            <Link to="/login" className="inline-link">click here</Link>
          </p>

          <p className="intro">
            This System is launched for students to access the following information:
          </p>

          <ul className="info-list">
            <li>all courses in his/her Curriculum</li>
            <li>Academic Status:- detail academic status starting from year 1, semester 1....,</li>
            <li>Detail about taken courses, exempted courses, waived courses,....</li>
            <li>Dormitory placement</li>
            <li>Other important information</li>
          </ul>

          <h3 className="section-title">Login Guideline:</h3>

          <p className="paragraph">
            In order to see your detail result, first you must log in. The login link is
            located at the Right Section /above the Online Users Section/.
          </p>

          <p className="paragraph">
            When the log in screen is displayed, you must enter your user name and
            password. Refer the following example table on how to use your id
            number and your Grandfather name as your user name and initial
            password respectively.
          </p>

          {/* Credentials table */}
          <table className="guide-table">
            <thead>
              <tr>
                <th>Student's<br />Father<br /><br />Full<br />Name</th>
                <th>Student ID</th>
                <th>User Name<br /><br />will be</th>
                <th>Temporary<br /><br />password</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Getahun<br />Abebe</td>
                <td>INU0800343UR</td>
                <td>INU0800343UR</td>
                <td>abebe1234abcd#</td>
                <td rowSpan="5" className="remark-cell">
                  All<br />characters<br />in the<br />temporary<br />
                  Password<br />are in<br />small<br />letter.
                </td>
              </tr>
              <tr>
                <td>Belay<br />Moges</td>
                <td>ENGR/3421/2002</td>
                <td>ENGR/3421/2002</td>
                <td>moges1234abcd#</td>
              </tr>
              <tr>
                <td>Sahre<br />Jemal</td>
                <td>INU0801234PR</td>
                <td>INU0801234PR</td>
                <td>jemal1234abcd#</td>
              </tr>
              <tr>
                <td>Abebe<br />Mamo</td>
                <td>INU0504341UD</td>
                <td>INU0504341UD</td>
                <td>mamo1234abcd#</td>
              </tr>
              <tr>
                <td>Gashaw<br />Taye</td>
                <td>INU0504678UDI</td>
                <td>INU0504678UDI</td>
                <td>taye1234abcd#</td>
              </tr>
            </tbody>
          </table>

          {/* 3 paragraphs below the table */}
          <p className="paragraph">
            As soon as you log in, the system will ask you to change your temporary
            password before accessing any resource that needs your identity.
            Therefore, you have to fill the new password and other requested
            information properly. The new password should not be less than 7
            characters.
          </p>

          <p className="paragraph">
            If you are unable to log in, please ask your concerned registrar
            office....because your id number and/or grandfather name may not be
            encoded correctly... Remember what you fill in the biography form....
          </p>

          <p className="paragraph">
            If you have any difficulties, you can contact the concerned Registrar
            office.
          </p>
        </main>
      </div>

      <div className="copyright-bar">Copyright 2026</div>
    </>
  );
}
