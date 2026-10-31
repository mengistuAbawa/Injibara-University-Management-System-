/** Field-selection results limited to the dean's assigned college. */
import { useEffect, useMemo, useState } from 'react';
import { getAllocationResults, getOverview } from '../../services/deanService';
import './AllocationResults.css';

const EMPTY_MESSAGE = 'No allocation results available yet. The Registrar must run the field-selection allocation first.';

function isAssigned(status) {
  return String(status || '').trim().toLowerCase() === 'assigned';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function AllocationResults() {
  const [rows, setRows] = useState([]);
  const [collegeName, setCollegeName] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getAllocationResults(), getOverview()])
      .then(([results, overview]) => {
        if (!active) return;
        setRows(Array.isArray(results) ? results : []);
        setCollegeName(overview?.college_name || '');
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.message || 'Unable to load allocation results.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(
    () => [...new Set(rows.map((row) => row.department_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesDepartment = !department || row.department_name === department;
      const matchesSearch = !normalizedSearch
        || `${row.student_name || ''} ${row.student_number || ''}`.toLowerCase().includes(normalizedSearch);
      return matchesDepartment && matchesSearch;
    });
  }, [department, rows, search]);

  const placedCount = rows.filter((row) => isAssigned(row.status)).length;
  const departmentCount = new Set(
    rows.filter((row) => isAssigned(row.status)).map((row) => row.department_name).filter(Boolean),
  ).size;
  const unassignedCount = rows.filter((row) => !isAssigned(row.status)).length;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <main className="actor-page dean-page allocation-results-page">
      <div className="title-strip allocation-results-title">
        <h1>Allocation Results — {collegeName || 'Your College'}</h1>
      </div>

      {error && <p className="dean-error" role="alert">{error}</p>}

      <section className="allocation-summary" aria-label="Allocation summary">
        <article className="allocation-summary-card">
          <span>Total Placed Students</span>
          <strong>{loading ? '—' : placedCount}</strong>
        </article>
        <article className="allocation-summary-card">
          <span>Total Departments</span>
          <strong>{loading ? '—' : departmentCount}</strong>
        </article>
        <article className="allocation-summary-card">
          <span>Unassigned Students</span>
          <strong>{loading ? '—' : unassignedCount}</strong>
        </article>
      </section>

      <section className="actor-card allocation-results-card">
        <div className="allocation-filter-row">
          <label>
            Search by student name/number
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Enter a name or student number"
            />
          </label>
          <label>
            Department
            <select
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All departments</option>
              {departments.map((name) => <option value={name} key={name}>{name}</option>)}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="allocation-results-message" role="status">Loading allocation results…</p>
        ) : rows.length === 0 ? (
          <p className="allocation-results-message">{EMPTY_MESSAGE}</p>
        ) : filteredRows.length === 0 ? (
          <p className="allocation-results-message">No results match the selected filters.</p>
        ) : (
          <>
            <div className="allocation-table-wrap">
              <table className="data-table allocation-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student No.</th>
                    <th>Student Name</th>
                    <th>Gender</th>
                    <th className="allocation-number">Entrance Score</th>
                    <th>Field (Department Chosen)</th>
                    <th>Department Assigned</th>
                    <th>Status</th>
                    <th>Announced On</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => (
                    <tr key={`${row.student_number}-${row.department_code || row.department_name}`}>
                      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td>{row.student_number}</td>
                      <td>{row.student_name}</td>
                      <td>{row.gender || '—'}</td>
                      <td className="allocation-number">{row.university_entrance_result ?? '—'}</td>
                      <td>{row.field_name}</td>
                      <td>{row.department_name}</td>
                      <td>
                        <span className={`allocation-status ${isAssigned(row.status) ? 'is-assigned' : 'is-unassigned'}`}>
                          {row.status || 'Not Assigned'}
                        </span>
                      </td>
                      <td>{formatDate(row.announced_on)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="allocation-pagination">
              <label>
                Rows per page
                <select
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 25, 50].map((size) => <option value={size} key={size}>{size}</option>)}
                </select>
              </label>
              <span aria-live="polite">
                {filteredRows.length === 0
                  ? '0 results'
                  : `${(currentPage - 1) * rowsPerPage + 1}–${Math.min(currentPage * rowsPerPage, filteredRows.length)} of ${filteredRows.length}`}
              </span>
              <div className="allocation-page-controls">
                <button type="button" className="secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  Previous
                </button>
                <span>Page {currentPage} of {pageCount}</span>
                <button type="button" className="secondary" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
