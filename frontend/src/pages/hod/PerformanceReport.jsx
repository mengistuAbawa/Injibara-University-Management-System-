import { useEffect, useState } from 'react';
import { getPerformance, getGradeDistribution } from '../../services/hodService';
import './PerformanceReport.css';

export default function PerformanceReport() {
  const [perf, setPerf] = useState([]);
  const [dist, setDist] = useState([]);

  useEffect(() => {
    getPerformance().then(setPerf).catch(console.error);
    getGradeDistribution().then(setDist).catch(console.error);
  }, []);

  const totalStudents = perf.reduce((a, p) => a + (p.students || 0), 0);
  const totalPassed   = perf.reduce((a, p) => a + (p.passed   || 0), 0);
  const totalFailed   = perf.reduce((a, p) => a + (p.failed   || 0), 0);
  const passRate = totalStudents === 0
    ? 0
    : Math.round((totalPassed / (totalPassed + totalFailed || 1)) * 100);

  return (
    <div className="perf-page">
      <div className="title-strip">Department Performance Report</div>

      <div className="mini-stats">
        <div><strong>{perf.length}</strong><span>Courses</span></div>
        <div><strong>{totalStudents}</strong><span>Total Enrollments</span></div>
        <div className="pass"><strong>{totalPassed}</strong><span>Passed</span></div>
        <div className="fail"><strong>{totalFailed}</strong><span>Failed</span></div>
        <div className="rate"><strong>{passRate}%</strong><span>Pass Rate</span></div>
      </div>

      <h3 className="section-title">Course Performance</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th><th>Title</th><th>Credit</th>
            <th>Sections</th><th>Students</th>
            <th>Avg Mark</th><th>Passed</th><th>Failed</th>
          </tr>
        </thead>
        <tbody>
          {perf.map((p) => (
            <tr key={p.course_id}>
              <td>{p.course_code}</td>
              <td>{p.course_title}</td>
              <td>{p.credit_hours}</td>
              <td>{p.sections}</td>
              <td>{p.students}</td>
              <td>{p.avg_mark ?? '—'}</td>
              <td className="pass">{p.passed}</td>
              <td className="fail">{p.failed}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="section-title">Grade Distribution (Department-wide)</h3>
      {dist.length === 0 ? (
        <p className="empty">No grades recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead><tr><th>Letter Grade</th><th>Count</th></tr></thead>
          <tbody>
            {dist.map((d, i) => (
              <tr key={i}>
                <td>{d.letter_grade}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}