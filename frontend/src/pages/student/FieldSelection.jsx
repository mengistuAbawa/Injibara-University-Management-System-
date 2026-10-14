import { useEffect, useState } from 'react';
import { getMyProfile } from '../../services/studentService';
import './FieldSelection.css';

export default function FieldSelection() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyProfile()
      .then((data) => setProfile(data || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStartSelection = () => {
    // Navigate to the actual department selection wizard
    // (e.g. a form where student picks fields in priority order)
    // For now, we can open a placeholder alert or route to /field-selection/select
    window.location.href = '/field-selection/select';
  };

  return (
    <div className="fieldsel-page">
      {/* Blue title strip */}
      <div className="title-strip">Department Placement Selection</div>

      {/* Info block */}
      <div className="info-block">
        <div className="info-grid">
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{profile.full_name || ''}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender:</span>
              <span className="info-value">{profile.gender || ''}</span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Handicapped Case:</span>
              <span className="info-value">{profile.handicapped_case || ''}</span>
            </div>
            <div className="info-item">
              <span className="info-label">University Entrance Result:</span>
              <span className="info-value">
                {profile.university_entrance_result || ''}
              </span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">High School Region:</span>
              <span className="info-value">{profile.highschool_region || ''}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current CGPA:</span>
              <span className="info-value">
                {profile.current_cgpa != null
                  ? Number(profile.current_cgpa).toFixed(2)
                  : ''}
              </span>
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label"></span>
              <span className="info-value"></span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Program:</span>
              <span className="info-value">{profile.department_name || ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Start button strip */}
      <div className="start-strip">
        <button className="start-btn" onClick={handleStartSelection}>
          Click Here to start Department Selection
        </button>
      </div>

      {/* Copyright bar */}
      <div className="copyright-bar">Copyright 2026</div>
    </div>
  );
}