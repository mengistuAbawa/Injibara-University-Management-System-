import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../admin/SystemSettings.css';

const emptyProfile = { username: '', first_name: '', last_name: '', email: '', phone_number: '' };

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/profile')
      .then(({ data }) => { if (active) setProfile({ ...emptyProfile, ...data }); })
      .catch(() => { if (active) setError('Could not load profile information.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const { data } = await api.put('/profile', profile);
      updateUser(data);
      setProfile({ ...emptyProfile, ...data });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="settings-page"><p>Loading profile...</p></div>;

  return <div className="settings-page">
    <h1>Edit Profile</h1>
    <div className="settings-panel" style={{ maxWidth: 720 }}>
      <p>Update your account information. Your changes will appear immediately in the sidebar.</p>
      {message && <div className="settings-message">{message}</div>}
      {error && <div className="settings-error">{error}</div>}
      <form onSubmit={submit} className="settings-form">
        <label>First name
          <input name="first_name" value={profile.first_name || ''} onChange={change} required />
        </label>
        <label>Last name
          <input name="last_name" value={profile.last_name || ''} onChange={change} required />
        </label>
        <label>Username
          <input name="username" value={profile.username || ''} onChange={change} />
        </label>
        <label>Email
          <input name="email" type="email" value={profile.email || ''} onChange={change} required />
        </label>
        {user?.role === 'instructor' && <label>Phone number
          <input name="phone_number" value={profile.phone_number || ''} onChange={change} />
        </label>}
        <button className="settings-save" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  </div>;
}
