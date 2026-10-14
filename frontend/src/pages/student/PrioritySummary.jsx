import { useEffect, useState } from 'react';
import { getPrioritySummary, getMyProfile } from '../../services/studentService';
import './PrioritySummary.css';

export default function PrioritySummary() {
  const [profile, setProfile] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(10);

  const [filters, setFilters] = useState({
    destination: '',
    priority: '',
    acYear: '2025/2026',
    semester: '2',
    year: '1',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      getMyProfile().catch(() => ({})),
      getPrioritySummary(filters).catch(() => []),
    ])
      .then(([profileData, summaryData]) => {
        setProfile(profileData || {});
        setRows(Array.isArray(summaryData) ? summaryData : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (key, value) => setFilters({ ...filters, [key]: value });

  return (
    <div className="priority-page">
      {/* Blue title strip */}
      <div className="title-strip">DepartmentSelectionSmryStudent</div>

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
          <div className="info-item right">
            <span className="info-label">Your Current Program:</span>
            <span className="info-value">{profile.department_name || ''}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Your Total Score</span>
            <span className="info-value">{profile.total_score || ''}</span>
          </div>
        </div>
      </div>

      {/* Important note (pink strip) */}
      <div className="important-note">
        <strong>Important Note :</strong> — By selecting destination program,
        priority, academic year, semester and year, you can see students who
        selected the selected destination program with the specified priority.
        Corresponding result is also listed for each student. By default, the
        table displays students by their Other Total Result value in descending
        order i.e. larger value comes first.
      </div>

      {/* Filter panel */}
      <div className="filter-panel">
        <div className="filter-row-p">
          <label>Destination Program:</label>
          <select
            value={filters.destination}
            onChange={(e) => handleFilter('destination', e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Systems">Information Systems</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>

        <div className="filter-row-p">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilter('priority', e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div className="filter-row-p">
          <label>Current AcYear:</label>
          <select
            value={filters.acYear}
            onChange={(e) => handleFilter('acYear', e.target.value)}
          >
            <option>2024/2025</option>
            <option>2025/2026</option>
            <option>2026/2027</option>
          </select>
        </div>

        <div className="filter-row-p">
          <label>Semester:</label>
          <select
            value={filters.semester}
            onChange={(e) => handleFilter('semester', e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <div className="filter-row-p">
          <label>Year:</label>
          <select
            value={filters.year}
            onChange={(e) => handleFilter('year', e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div className="filter-row-p">
          <button className="search-btn" onClick={load}>Search</button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-wrap">
        <table className="priority-grid">
          <thead>
            <tr>
              <Th label="Student No." />
              <Th label="Gender" />
              <Th label="Student Academic Status" />
              <Th label="Exam Result" />
              <Th label="Other Total Result" />
              <Th label="Total Result" />
              <Th label="Priority" />
              <Th label="Application Status" />
              <Th label="Placement Status" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="empty-row">Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-row">
                  There are no records available
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.student_number}</td>
                  <td>{r.gender}</td>
                  <td>{r.academic_status}</td>
                  <td>{r.exam_result}</td>
                  <td>{r.other_total_result}</td>
                  <td>{r.total_result}</td>
                  <td>{r.priority}</td>
                  <td>{r.application_status}</td>
                  <td>{r.placement_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="grid-footer">
          <div className="left">
            Records per page:
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="right">
            Records: 0 - {rows.length} of {rows.length}
            <span className="pages">
              — Pages:
              <button className="page-btn" disabled>◀</button>
              <button className="page-btn" disabled>▶</button>
            </span>
          </div>
        </div>
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