import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMySections,
  getSectionPerformance,
} from '../../services/instructorService';
import './ClassPerformance.css';

export default function ClassPerformance() {
  const [params] = useSearchParams();
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(params.get('section') || '');
  const [data, setData] = useState(null);

  useEffect(() => {
    getMySections().then(setSections).catch(console.error);
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    getSectionPerformance(sectionId).then(setData).catch(console.error);
  }, [sectionId]);

  const stats = data?.stats || {};
  const distribution = data?.distribution || [];

  return (
    <div className="cp-page">
      <div className="title-strip">Class Performance</div>

      <div className="filter-row">
        <label>Section
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">-- Select Section --</option>
            {sections.map((s) => (
              <option key={s.section_id} value={s.section_id}>
                {s.course_code} — {s.course_title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-box"><div className="v">{stats.total ?? 0}</div><div className="l">Total Students</div></div>
            <div className="stat-box"><div className="v">{stats.avg_mark ?? '—'}</div><div className="l">Average Mark</div></div>
            <div className="stat-box"><div className="v">{stats.min_mark ?? '—'}</div><div className="l">Min</div></div>
            <div className="stat-box"><div className="v">{stats.max_mark ?? '—'}</div><div className="l">Max</div></div>
            <div className="stat-box green"><div className="v">{stats.passed ?? 0}</div><div className="l">Passed</div></div>
            <div className="stat-box red"><div className="v">{stats.failed ?? 0}</div><div className="l">Failed</div></div>
          </div>

          <h3 className="section-title">Grade Distribution</h3>
          {distribution.length === 0 ? (
            <p className="empty">No grades recorded yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Letter Grade</th><th>Count</th></tr>
              </thead>
              <tbody>
                {distribution.map((d, i) => (
                  <tr key={i}>
                    <td>{d.letter_grade}</td>
                    <td>{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}