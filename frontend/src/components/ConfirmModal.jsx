import { useState } from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, requirePassword = false }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requirePassword && !password.trim()) {
      setError('Please enter your password');
      return;
    }
    setPassword('');
    setError('');
    onConfirm(password);
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        {requirePassword && (
          <div className="form-group">
            <input
              type="password"
              placeholder="Enter password to confirm"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            {error && <span className="field-error">{error}</span>}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={handleConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
