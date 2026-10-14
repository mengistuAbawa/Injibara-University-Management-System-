import { useEffect, useState } from 'react';
import {
  listAllInstructors, listDepartments, promoteToHod, demoteHod,
} from '../../services/adminService';
import './ManageInstructors.css';

export default function ManageInstructors() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState('');

  const load = () => listAllInstructors().then(setItems).catch(console.error);

  useEffect(() => {
    load();
    listDepartments().then(setDepartments).catch(console.error);
  }, []);

  const promote = async (instructor_id, department_id) => {
    try {
      await promoteToHod({ instructor_id, department_id });
      setMessage('✅ Instructor promoted to HOD');
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed'));
    }
  };

  const demote = async (instructorId) => {
    if (!window.confirm('Remove HOD status?')) return;
    await demoteHod(instructorId);
    setMessage('✅ HOD removed');
    load();
  };

  return (
    <div className="minst-page">
      <div className="title-strip">Instructor Directory ({items.length})</div>

      {message && <div className="msg">{message}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Emp No.</th><th>Name</th><th>Gender</th>
            <th>Rank</th><th>Department</th>
            <th>HOD</th><th>Assign HOD</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.instructor_id}>
              <td>{i.employee_number}</td>
              <td>{i.first_name} {i.last_name}</td>
              <td>{i.gender}</td>
              <td>{i.academic_rank}</td>
              <td>{i.department_name}</td>
              <td>{i.is_hod ? '✔' : '—'}</td>
              <td>
                <select
                  onChange={(e) => e.target.value && promote(i.instructor_id, Number(e.target.value))}
                  value=""
                >
                  <option value="">-- Promote --</option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {i.is_hod && (
                  <button className="mini del" onClick={() => demote(i.instructor_id)}>
                    Remove HOD
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
