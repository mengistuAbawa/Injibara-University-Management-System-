/** Searchable department picker modal for ranked student field selection. */
import { useEffect, useMemo, useState } from 'react';
import { getAvailableDepartments } from '../services/studentService';
import './DepartmentSelectModal.css';

export default function DepartmentSelectModal({ score, priorities, onAdd, onClose }) {
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [priority, setPriority] = useState('1');
  const [search, setSearch] = useState('');
  const [college, setCollege] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAvailableDepartments(!onlyAvailable)
      .then((rows) => { if (active) { setDepartments(rows); setError(''); } })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Could not load departments'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onlyAvailable]);

  useEffect(() => {
    const current = selected && priorities.find((item) => Number(item.field_id) === Number(selected.field_id));
    const firstFree = [1, 2, 3, 4, 5].find((rank) => !priorities.some((item) => Number(item.priority) === rank));
    setPriority(String(current?.priority || firstFree || 1));
  }, [selected?.field_id, priorities]);

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const departmentRows = useMemo(() => {
    const byDepartment = new Map();
    departments.forEach((item) => {
      const existing = byDepartment.get(Number(item.department_id));
      if (!existing || (!existing.field_id && item.field_id)) byDepartment.set(Number(item.department_id), item);
    });
    return [...byDepartment.values()];
  }, [departments]);
  const colleges = useMemo(() => [...new Set(departmentRows.map((item) => item.college_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [departmentRows]);
  const visible = useMemo(() => departmentRows.filter((item) => {
    const available = Boolean(item.is_available_for_selection);
    const text = `${item.department_name || ''} ${item.department_code || ''} ${item.college_name || ''}`.toLowerCase();
    return (!onlyAvailable || available) && (!college || item.college_name === college) && text.includes(search.trim().toLowerCase());
  }).sort((a, b) => String(a.college_name || '').localeCompare(String(b.college_name || '')) || String(a.department_name).localeCompare(String(b.department_name))), [departmentRows, onlyAvailable, college, search]);

  const canChoose = (item) => Number(item.field_id) > 0 && Boolean(item.is_available_for_selection) &&
    (Number(item.seats_left) > 0 || priorities.some((row) => Number(row.field_id) === Number(item.field_id))) &&
    Number(score || 0) >= Number(item.min_score || 0);

  const add = () => {
    if (!selected) return;
    const rank = Number(priority);
    const occupied = priorities.some((item) => Number(item.priority) === rank && Number(item.field_id) !== Number(selected.field_id));
    if (occupied) { setNotice(`Priority ${rank} is already in use. Choose another rank.`); return; }
    onAdd({ field_id: Number(selected.field_id), priority: rank, field_name: selected.field_name, department_name: selected.department_name, college_name: selected.college_name });
    setNotice(`${selected.department_name} added at priority ${rank}.`);
    setSelected(null);
  };
  const selectedAlreadyAdded = selected && priorities.some((item) => Number(item.field_id) === Number(selected.field_id));
  const noFreePriority = priorities.length >= 5 && !selectedAlreadyAdded;

  return <div className="department-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="department-modal" role="dialog" aria-modal="true" aria-labelledby="department-modal-title">
      <header className="department-modal-header"><h2 id="department-modal-title">Select Your Field (Department)</h2><button type="button" className="department-modal-close" aria-label="Close" onClick={onClose}>×</button></header>
      <div className="department-modal-body">
        <p className="department-score">Your Entrance Score: <strong>{Number(score || 0).toFixed(2)}</strong></p>
        <div className="department-filters">
          <label className="department-search">Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Department or code" /></label>
          <label>College<select value={college} onChange={(event) => setCollege(event.target.value)}><option value="">All colleges</option>{colleges.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label className="department-available-filter"><input type="checkbox" checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} /> Only Available</label>
        </div>
        {error && <p className="department-modal-error" role="alert">{error}</p>}
        {loading ? <p>Loading departments…</p> : <div className="department-table-scroll"><table className="department-table"><thead><tr><th>#</th><th>Code</th><th>Department Name</th><th>College</th><th>Capacity</th><th>Min Score</th><th>Seats Left</th></tr></thead>
          <tbody>{visible.map((item, index) => {
            const eligible = canChoose(item);
            const current = priorities.some((row) => Number(row.field_id) === Number(item.field_id));
            const rowClass = !item.is_available_for_selection ? 'department-row-unavailable' : eligible ? 'department-row-eligible' : 'department-row-ineligible';
            return <tr key={`${item.department_id}-${item.field_id || 'none'}`} className={`${rowClass} ${Number(selected?.field_id) === Number(item.field_id) ? 'department-row-selected' : ''}`} aria-disabled={!eligible} onClick={() => { if (eligible) { setSelected(item); setNotice(''); } }}>
              <td><input type="radio" name="department" aria-label={`Select ${item.department_name}`} checked={Number(selected?.field_id) === Number(item.field_id)} disabled={!eligible} onChange={() => setSelected(item)} /></td>
              <td>{item.department_code || '—'}</td><td>{item.department_name}{current && <small className="department-current-label"> Already in priorities</small>}</td><td>{item.college_name || '—'}</td><td>{item.capacity}</td><td>{Number(item.min_score || 0).toFixed(2)}</td>
              <td>{!item.is_available_for_selection ? <span className="department-red">Unavailable</span> : !item.field_id ? <span className="department-red">Not configured</span> : score < Number(item.min_score || 0) ? <span className="department-red">Below Cutoff</span> : Number(item.seats_left) <= 0 ? <span className="department-red">FULL</span> : Number(item.seats_left)}</td>
            </tr>;
          })}{!visible.length && <tr><td colSpan="7">No departments match these filters.</td></tr>}</tbody></table></div>}
        <div className="department-priority-preview"><strong>Current priorities</strong>{priorities.length ? <ol>{[...priorities].sort((a,b)=>a.priority-b.priority).map((item)=><li key={item.field_id}>Priority {item.priority}: {item.department_name || item.field_name}</li>)}</ol> : <p>None added yet.</p>}</div>
      </div>
      <footer className="department-modal-footer"><div className="department-modal-selection"><strong>Selected:</strong> {selected?.department_name || 'None selected'}
        <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)} disabled={!selected}>{[1,2,3,4,5].map((rank) => {
          const taken = priorities.some((item) => Number(item.priority) === rank && Number(item.field_id) !== Number(selected?.field_id));
          return <option key={rank} value={rank} disabled={taken}>Priority {rank}{taken ? ' (in use)' : ''}</option>;
        })}</select></label>
      </div><div className="department-modal-actions"><button type="button" className="department-add-button" onClick={add} disabled={!selected || noFreePriority}>Add to My Priorities</button><button type="button" className="department-cancel-button" onClick={onClose}>Cancel</button></div>
        {notice && <p className="department-modal-notice" role="status">{notice}</p>}
      </footer>
    </section>
  </div>;
}
