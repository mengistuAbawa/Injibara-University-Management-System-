import './GmailAddressInput.css';

export default function GmailAddressInput({ name = 'email', value, onChange, required = true, autoComplete = 'email' }) {
  const handleChange = (event) => {
    const localPart = event.target.value
      .replace(/@gmail\.com$/i, '')
      .replace(/@.*$/, '');
    onChange({ target: { name, value: localPart } });
  };

  return (
    <span className="gmail-input">
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        autoComplete={autoComplete}
        inputMode="email"
        maxLength={30}
        pattern="[A-Za-z0-9.]+"
        title="Enter the Gmail username before @gmail.com using letters, numbers, or periods."
        placeholder="yourname"
        aria-label="Gmail username"
        required={required}
      />
      <span className="gmail-domain">@gmail.com</span>
    </span>
  );
}
