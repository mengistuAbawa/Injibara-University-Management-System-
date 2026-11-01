import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../services/alumniService';
import './AlumniProfile.css';

const initialForm = {
  current_email: '',
  current_phone: '',
  current_address: '',
  employer: '',
  job_title: '',
};

export default function AlumniProfile() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) {
          setForm(Object.fromEntries(
            Object.keys(initialForm).map((field) => [field, profile[field] || ''])
          ));
        }
      })
      .catch((cause) => {
        if (active) setError(cause.response?.data?.message || 'Could not load your profile.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updateProfile(form);
      setSuccess('Your contact information has been saved.');
    } catch (cause) {
      setError(cause.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="alumni-page alumni-profile-page">
      <header className="alumni-title-strip"><h1>My Profile</h1></header>
      {loading ? <p role="status">Loading profile…</p> : (
        <form className="alumni-profile-form" onSubmit={handleSubmit}>
          <label>
            Current Email
            <input name="current_email" type="email" maxLength={100} value={form.current_email} onChange={handleChange} />
          </label>
          <label>
            Current Phone
            <input name="current_phone" type="tel" maxLength={15} value={form.current_phone} onChange={handleChange} />
          </label>
          <label>
            Current Address
            <textarea name="current_address" maxLength={5000} rows={4} value={form.current_address} onChange={handleChange} />
          </label>
          <label>
            Employer
            <input name="employer" maxLength={150} value={form.employer} onChange={handleChange} />
          </label>
          <label>
            Job Title
            <input name="job_title" maxLength={150} value={form.job_title} onChange={handleChange} />
          </label>
          {error && <p className="alumni-error" role="alert">{error}</p>}
          {success && <p className="alumni-success" role="status">{success}</p>}
          <button className="alumni-submit" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      )}
    </section>
  );
}
