import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitRequest } from '../../services/alumniService';
import './RequestDocument.css';

export default function RequestDocument() {
  const [requestType, setRequestType] = useState('transcript');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitRequest({ request_type: requestType, purpose });
      navigate('/alumni/requests');
    } catch (cause) {
      setError(cause.response?.data?.message || 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="alumni-page alumni-request-page">
      <header className="alumni-title-strip"><h1>Request Document</h1></header>
      <form className="alumni-form" onSubmit={handleSubmit}>
        <label>
          Document Type
          <select value={requestType} onChange={(event) => setRequestType(event.target.value)} required>
            <option value="transcript">Official Transcript</option>
            <option value="degree_verification">Degree Verification Letter</option>
            <option value="recommendation">Recommendation Letter</option>
            <option value="replacement_id">Replacement ID Card</option>
          </select>
        </label>
        <label>
          Purpose
          <textarea
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            maxLength={2000}
            rows={5}
            required
          />
        </label>
        {error && <p className="alumni-error" role="alert">{error}</p>}
        <button className="alumni-submit" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </section>
  );
}
