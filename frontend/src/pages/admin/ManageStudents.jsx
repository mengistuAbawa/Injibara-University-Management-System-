import { useEffect, useState } from 'react';
import { listAllStudents } from '../../services/adminService';
import './ManageStudents.css';

export default function ManageStudents() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    listAllStudents().then(setItems).catch(console.error);
  }, []);

  const filtered = items.filter((s) =>
    (s.student_number + s.first_name + s.last_name + (s.department_name || ''))
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <div className="mstud-page">
      <div className="title-strip">Student Directory ({items.length})</div>

      <div className="filter-row">
        <input
          placeholder="Filter by ID, name or department…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student No.</th><th>Name</th><th>Gender</th>
            <th>Department</th><th>Year</th><th>Region</th>
            <th>Status</th><th>Email</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.student_id}>
              <td>{s.student_number}</td>
              <td>{s.first_name} {s.last_name}</td>
              <td>{s.gender}</td>
              <td>{s.department_name || '—'}</td>
              <td>{s.current_year}</td>
              <td>{s.region}</td>
              <td>{s.status}</td>
              <td>{s.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}