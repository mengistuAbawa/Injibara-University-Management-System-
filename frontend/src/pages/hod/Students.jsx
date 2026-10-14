import { useEffect, useState } from 'react';
import { listStudents } from '../../services/hodService';
import './Students.css';

export default function Students() {
  const [rows, setRows] = useState([]);
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');

  const load = () => {
    listStudents({ year, status }).then(setRows).catch(console.error);
  };

  useEffect(() => { load(); }, [year, status]);

  return (
    <div className="hod-stud-page">
      <div className="title-strip">Department Students</div>

      <div className="filter-row">
        <label>Year
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
          </select>
        </label>

        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Active</option>
            <option>Graduated</option>
            <option>Suspended</option>
            <option>Withdrawn</option>
          </select>
        </label>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student No.</th><th>Name</th><th>Gender</th>
            <th>Year</th><th>Region</th><th>CGPA</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.student_id}>
              <td>{s.student_number}</td>
              <td>{s.first_name} {s.last_name}</td>
              <td>{s.gender}</td>
              <td>{s.current_year}</td>
              <td>{s.region}</td>
              <td>{s.cgpa ?? '—'}</td>
              <td>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}