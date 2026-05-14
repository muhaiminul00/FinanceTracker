import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { checkPasswordStrength } from '../utils/validators';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePasswordChange = (val) => {
    setPassword(val);
    setPasswordStrength(checkPasswordStrength(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      setError('Password too weak: ' + strength.errors.join(', '));
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const strengthColors = {
    weak: '#f87171',
    medium: '#fb923c',
    strong: '#34d399'
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => handlePasswordChange(e.target.value)} 
                required 
                placeholder="Min 8 chars, A-Z, a-z, 0-9, symbol"
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {passwordStrength && password.length > 0 && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: passwordStrength.strength === 'strong' ? '100%' : passwordStrength.strength === 'medium' ? '60%' : '30%',
                      background: strengthColors[passwordStrength.strength]
                    }}
                  />
                </div>
                <span style={{ color: strengthColors[passwordStrength.strength], fontSize: '0.75rem', fontWeight: 600 }}>
                  {passwordStrength.strength.toUpperCase()}
                </span>
                {passwordStrength.errors.length > 0 && (
                  <ul className="strength-errors">
                    {passwordStrength.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              placeholder="Re-enter password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create Account</button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
