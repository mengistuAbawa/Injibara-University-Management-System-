import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProfilePhoto.css';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(blob);
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not process this image.')), 'image/jpeg', 0.86);
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Choose a valid image file.')); };
    image.src = objectUrl;
  });
}

export default function ProfilePhoto() {
  const { user, updateUser } = useAuth();
  const fileInput = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOpen]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const savePhoto = async (blob) => {
    setBusy(true); setError('');
    try {
      const image = await blobToDataUrl(blob);
      const { data } = await api.put('/profile/avatar', { image });
      updateUser({ avatar_path: data.avatar_path });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save your profile photo.');
    } finally { setBusy(false); }
  };

  const chooseFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try { await savePhoto(await compressImage(file)); }
    catch (err) { setError(err.message || 'Could not use this image.'); }
  };

  const startCamera = async () => {
    setError('');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      setCameraOpen(true);
    } catch {
      setError('Camera access is unavailable. Allow camera access in your browser and try again.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) { setError('Camera is not ready yet.'); return; }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      closeCamera();
      if (blob) savePhoto(blob);
      else setError('Could not capture the photo. Try again.');
    }, 'image/jpeg', 0.86);
  };

  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.email || 'User';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const imageUrl = user?.avatar_path ? `${apiOrigin}${user.avatar_path}` : '';

  return <div className="profile-photo-widget">
    <div className="profile-photo-avatar">
      {imageUrl ? <img src={imageUrl} alt={`${name} profile`} /> : <span>{initials}</span>}
    </div>
    <div className="profile-photo-details">
      <strong>{name}</strong>
      {user?.student_number && <small>{user.student_number}</small>}
      <div className="profile-photo-actions">
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? 'Saving…' : user?.avatar_path ? 'Change photo' : 'Upload photo'}</button>
        <button type="button" disabled={busy} onClick={startCamera}>Use camera</button>
      </div>
      <input ref={fileInput} className="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
      {error && <small className="profile-photo-error" role="alert">{error}</small>}
    </div>
    {cameraOpen && <div className="profile-camera-backdrop" role="presentation" onClick={closeCamera}>
      <section className="profile-camera-dialog" role="dialog" aria-modal="true" aria-label="Take a profile photo" onClick={(event) => event.stopPropagation()}>
        <h3>Take a profile photo</h3><video ref={videoRef} autoPlay playsInline />
        <div><button type="button" onClick={takePhoto}>Take photo</button><button type="button" onClick={closeCamera}>Cancel</button></div>
      </section>
    </div>}
  </div>;
}
