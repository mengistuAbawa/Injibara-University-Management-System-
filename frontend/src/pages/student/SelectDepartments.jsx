import { useEffect, useState } from 'react';
import { getFields, getPriority, selectFields } from '../../services/studentService';

export default function SelectDepartments() {
  const [options, setOptions] = useState([]); const [chosen, setChosen] = useState([]); const [pending, setPending] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => {
    Promise.all([getFields(), getPriority()]).then(([available, saved]) => {
      setOptions(available);
      setChosen(saved.map((row) => Number(row.field_id)).filter((id) => available.some((item) => Number(item.field_id) === id)));
    }).catch((err) => setMessage(err.response?.data?.message || 'Could not load departments'));
  }, []);
  const add = () => { const id = Number(pending); if (id && !chosen.includes(id) && chosen.length < 5) setChosen([...chosen, id]); setPending(''); };
  const move = (index, amount) => { const target = index + amount; if (target < 0 || target >= chosen.length) return; const next = [...chosen]; [next[index], next[target]] = [next[target], next[index]]; setChosen(next); };
  const save = async () => { try { const result = await selectFields(chosen); setMessage(result.message); } catch (err) { setMessage(err.response?.data?.message || 'Could not save choices'); } };
  return <section className="page-container"><h2>Choose Department Priorities</h2><p>Add up to five options, then order them from highest to lowest priority.</p>
    {message && <p role="status">{message}</p>}
    <div><select value={pending} onChange={(e) => setPending(e.target.value)}><option value="">Choose an available department</option>{options.filter((item) => !chosen.includes(Number(item.field_id))).map((item) => <option key={item.field_id} value={item.field_id}>{item.department_name} — {item.field_name}</option>)}</select> <button type="button" onClick={add} disabled={!pending || chosen.length >= 5}>Add</button></div>
    <ol>{chosen.map((id, index) => { const item = options.find((option) => Number(option.field_id) === id); return <li key={id}>{item?.department_name} — {item?.field_name} <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>Up</button> <button type="button" onClick={() => move(index, 1)} disabled={index === chosen.length - 1}>Down</button> <button type="button" onClick={() => setChosen(chosen.filter((value) => value !== id))}>Remove</button></li>; })}</ol>
    <button type="button" onClick={save} disabled={!chosen.length}>Save priorities</button>
  </section>;
}
