import { useEffect, useState } from 'react';
import { getMyStatus } from '../../services/studentService';
import './MyStatus.css';

export default function MyStatus() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(16);

  const load = () => {
    setLoading(true);
    getMyStatus()
      .then((data) => {
        // If backend returns a single object, wrap in array
        setRecords(Array.isArray(data) ? data : data ? [data] : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mystatus-page">
      {/* Blue title strip */}
      <div className="title-strip">
        My Academic Status (my academic status, CPA, ...)
      </div>

      {/* Search button row */}
      <div className="search-row">
        <button className="search-records-btn" onClick={load}>
          Click here to search for my records....
        </button>
      </div>

      {/* Grid */}
      <div className="grid-wrap">
        <table className="status-grid">
          <thead>
            <tr>
              <Th label="AcYear" />
              <Th label="Year" />
              <Th label="Semester" />
              <Th label="Registration Date" />
              <Th label="Remark" />
              <Th label="Reg.Type" />
              <Th label="Reg.Type" />
              <Th label="SGPA" />
              <Th label="CGPA" />
              <Th label="Prev. Status" />
              <Th label="Final Status" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="empty-row">Loading...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-row">
                  There are no records available
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i}>
                  <td><span className="row-handle">▣</span> {r.academic_year}</td>
                  <td>{r.year}</td>
                  <td>{r.semester}</td>
                  <td>{r.registration_date}</td>
                  <td>{r.remark || 'Normal Load'}</td>
                  <td>{r.reg_type || 'N'}</td>
                  <td>{r.reg_type2 || 'N'}</td>
                  <td>{Number(r.sgpa).toFixed(2)}</td>
                  <td>{Number(r.cgpa).toFixed(2)}</td>
                  <td className={r.prev_status === 'Pass' ? 'pass' : ''}>
                    {r.prev_status ?? '—'}
                  </td>
                  <td className={r.final_status === 'Pass' ? 'pass' : ''}>
                    {r.final_status ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Grid footer */}
        <div className="grid-footer">
          <div className="left">
            Records per page:
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={16}>16</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="right">
            Records: 1 - {records.length} of {records.length}
            <span className="pages">
              — Pages:
              <button className="page-btn" disabled>◀</button>
              <button className="page-btn" disabled>▶</button>
            </span>
          </div>
        </div>
      </div>

      {/* Copyright footer */}
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