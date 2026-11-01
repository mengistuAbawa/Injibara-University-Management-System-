import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './EditProfile.css';

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

  if (loading) return <div className="edit-profile-page"><div className="edit-profile-loading">Loading profile...</div></div>;

  return <div className="edit-profile-page">
    <div className="edit-profile-heading">
      <span>Edit account details</span>
      <h1>Edit Profile</h1>
      <p>Update your personal and account information.</p>
    </div>
    <div className="edit-profile-card">
      {message && <div className="edit-profile-message success" role="status">{message}</div>}
      {error && <div className="edit-profile-message error" role="alert">{error}</div>}
      <form onSubmit={submit} className="edit-profile-form">
        <label><span>First name</span>
          <input name="first_name" value={profile.first_name || ''} onChange={change} required />
        </label>
        <label><span>Last name</span>
          <input name="last_name" value={profile.last_name || ''} onChange={change} required />
        </label>
        <label><span>Username</span>
          <input name="username" value={profile.username || ''} onChange={change} />
        </label>
        <label><span>Email address</span>
          <input name="email" type="email" value={profile.email || ''} onChange={change} required />
        </label>
        {user?.role === 'instructor' && <label className="edit-profile-wide"><span>Phone number</span>
          <input name="phone_number" value={profile.phone_number || ''} onChange={change} />
        </label>}
        <button className="edit-profile-save" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  </div>;
}
