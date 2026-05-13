import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const accountTypes = [
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' }
];

const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'bank', opening_balance: '', color: '#3b82f6', icon: '' });

  const fetchAccounts = () => {
    api.get('/accounts').then(res => setAccounts(res.data));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/accounts', {
      ...form,
      opening_balance: parseFloat(form.opening_balance) || 0
    });
    setShowForm(false);
    setForm({ name: '', type: 'bank', opening_balance: '', color: '#3b82f6', icon: '' });
    fetchAccounts();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    await api.delete(`/accounts/${id}`);
    fetchAccounts();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Accounts</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>New Account</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {accountTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Opening Balance</label>
                <input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({...form, opening_balance: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {colors.map(c => (
                    <div 
                      key={c} 
                      className={`color-option ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({...form, color: c})}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create Account</button>
          </form>
        </div>
      )}

      <div className="accounts-grid">
        {accounts.map(acc => (
          <div key={acc.id} className="account-card" style={{ borderLeftColor: acc.color || '#3b82f6' }}>
            <div className="account-header">
              <h3><Link to={`/accounts/${acc.id}`}>{acc.name}</Link></h3>
              <span className="account-type">{accountTypes.find(t => t.value === acc.type)?.label}</span>
            </div>
            <div className="account-balance">৳{acc.current_balance?.toFixed(2)}</div>
            <div className="account-actions">
              <Link to={`/accounts/${acc.id}`} className="btn btn-small">View</Link>
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(acc.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
