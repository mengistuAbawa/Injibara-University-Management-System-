import { useEffect, useState } from 'react';
import { getResults, getMyProfile } from '../../services/studentService';
import './SelectionResultsSummary.css';

export default function SelectionResultsSummary() {
  const [profile, setProfile] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      getMyProfile().catch(() => ({})),
      getResults().catch(() => []),
    ])
      .then(([profileData, resultData]) => {
        setProfile(profileData || {});
        setRows(Array.isArray(resultData) ? resultData : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="srs-page">
      {/* Blue title strip */}
      <div className="title-strip">DeptPlacementSummary</div>

      {/* Info block */}
      <div className="info-block">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Full Name:</span>
            <span className="info-value">{profile.full_name || ''}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender:</span>
            <span className="info-value">{profile.gender || ''}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Current Program:</span>
            <span className="info-value">{profile.department_name || ''}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Handicapped Case:</span>
            <span className="info-value">{profile.handicapped_case || ''}</span>
          </div>
          <div className="info-item">
            <span className="info-label">University Entrance Result:</span>
            <span className="info-value">{profile.university_entrance_result || ''}</span>
          </div>

          <div className="info-item">
            <span className="info-label">HighSchool Region:</span>
            <span className="info-value">{profile.highschool_region || ''}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Current CGPA:</span>
            <span className="info-value">
              {profile.current_cgpa != null ? Number(profile.current_cgpa).toFixed(2) : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="section-label">Department Placement Result...</div>

      {/* Grid */}
      <div className="grid-wrap">
        <table className="srs-grid">
          <thead>
            <tr>
              <Th label="Destination Department" />
              <Th label="Priority" />
              <Th label="Highschool Exam" />
              <Th label="Gender" />
              <Th label="Gender Emerging Region" />
              <Th label="Handicapped" />
              <Th label="Handicapped" />
              <Th label="CANG" />
              <Th label="Exam" />
              <Th label="Total Result" />
              <Th label="Application Status" />
              <Th label="Placement Status" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="empty-row">Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-row">
                  There are no records available
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.destination_department}</td>
                  <td>{r.priority}</td>
                  <td>{r.highschool_exam}</td>
                  <td>{r.gender}</td>
                  <td>{r.gender_emerging_region}</td>
                  <td>{r.handicapped}</td>
                  <td>{r.handicapped_2}</td>
                  <td>{r.cang}</td>
                  <td>{r.exam}</td>
                  <td>{r.total_result}</td>
                  <td>{r.application_status}</td>
                  <td>{r.placement_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Copyright bar */}
      <div className="copyright-bar">Copyright 2026</div>
    </div>
  );
}

/* --------- Header cell with sort + filter icons --------- */
function Th({ label }) {
  return (
    <th>
      <span className="th-label">{label}</span>
      <span className="th-icons">
        <span className="sort-icon">⬍</span>
        <span className="filter-icon">▼</span>
      </span>
    </th>
  );
}
