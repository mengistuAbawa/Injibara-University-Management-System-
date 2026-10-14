import { useEffect, useState } from 'react';
import { listFields, createField, updateField, deleteField, listDepartments } from '../../services/adminService';
import './ManageFields.css';

export default function ManageFields() {
  const [items, setItems] = useState([]); const [departments, setDepartments] = useState([]);
  const [name, setName] = useState(''); const [departmentId, setDepartmentId] = useState(''); const [editing, setEditing] = useState(null); const [message, setMessage] = useState('');
  const load = () => listFields().then(setItems).catch(console.error);
  useEffect(() => { load(); listDepartments().then(setDepartments).catch(console.error); }, []);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { field_name: name, department_id: departmentId || null };
      if (editing) await updateField(editing.field_id, payload); else await createField(payload);
      setMessage(editing ? 'Placement option updated' : 'Placement option created'); setName(''); setDepartmentId(''); setEditing(null); load();
    } catch (err) { setMessage(err.response?.data?.message || 'Could not save placement option'); }
  };
  const del = async (id) => {
    if (!window.confirm('Delete this placement option?')) return;
    try { await deleteField(id); setMessage('Placement option deleted'); load(); }
    catch (err) { setMessage(err.response?.data?.message || 'Could not delete placement option'); }
  };
  return <div className="mf-page">
    <div className="title-strip">Department Placement Options</div>
    <p>Create student choice labels and map each one to a department. Only options mapped to available departments appear to students.</p>
    <form className="field-form" onSubmit={submit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Option label (e.g. Computer Science)" required />
      <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required><option value="">Select department</option>{departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}</select>
      <button type="submit" className="create-btn">{editing ? 'Save Option' : 'Add Option'}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); setName(''); setDepartmentId(''); }}>Cancel</button>}
    </form>
    {message && <div className="msg" role="status">{message}</div>}
    <table className="data-table"><thead><tr><th>ID</th><th>Option</th><th>Department</th><th>Selections</th><th>Actions</th></tr></thead><tbody>
      {items.map((f) => <tr key={f.field_id}><td>{f.field_id}</td><td>{f.field_name}</td><td>{f.department_name || 'Not mapped'}</td><td>{f.selection_count}</td><td><button className="mini" onClick={() => { setEditing(f); setName(f.field_name); setDepartmentId(f.department_id || ''); }}>Edit</button> <button className="mini del" onClick={() => del(f.field_id)}>Delete</button></td></tr>)}
    </tbody></table>
  </div>;
}
