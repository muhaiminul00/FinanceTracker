import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ConfirmModal from '../components/ConfirmModal';
import { validatePhone, validateEmail, getCountryRules } from '../utils/validators';

export default function People() {
  const [people, setPeople] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [countryCode, setCountryCode] = useState('BD');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

  const countryRules = getCountryRules();

  const fetchPeople = () => {
    api.get('/people').then(res => setPeople(res.data));
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = 'Name is required';
    }

    if (form.phone) {
      const phoneCheck = validatePhone(form.phone, countryCode);
      if (!phoneCheck.isValid) {
        errors.phone = phoneCheck.error;
      }
    }

    if (form.email) {
      const emailCheck = validateEmail(form.email);
      if (!emailCheck.isValid) {
        errors.email = emailCheck.error;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    await api.post('/people', form);
    setShowForm(false);
    setForm({ name: '', phone: '', email: '' });
    setFormErrors({});
    fetchPeople();
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ open: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    await api.delete(`/people/${deleteModal.id}`);
    setDeleteModal({ open: false, id: null, name: '' });
    fetchPeople();
  };

  return (
    <div>
      <div className="page-header">
        <h1>People & Debts</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Person'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>New Person</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Full name"
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                  {Object.entries(countryRules).map(([code, rule]) => (
                    <option key={code} value={code}>{rule.name} ({rule.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="phone-input-wrapper">
                  <span className="country-code">{countryRules[countryCode].code}</span>
                  <input 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    placeholder={countryRules[countryCode].placeholder}
                    type="tel"
                  />
                </div>
                {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder="Optional"
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block">Add Person</button>
          </form>
        </div>
      )}

      <div className="people-grid">
        {people.map(p => (
          <div key={p.id} className="person-card">
            <div className="person-header">
              <h3><Link to={`/people/${p.id}`}>{p.name}</Link></h3>
            </div>
            <div className="person-balances">
              <div className="balance-item receivable">
                <span>They owe</span>
                <strong>৳{p.total_receivable?.toFixed(2)}</strong>
              </div>
              <div className="balance-item payable">
                <span>You owe</span>
                <strong>৳{p.total_payable?.toFixed(2)}</strong>
              </div>
              <div className={`balance-item ${p.net_balance >= 0 ? 'positive' : 'negative'}`}>
                <span>Net</span>
                <strong>৳{p.net_balance?.toFixed(2)}</strong>
              </div>
            </div>
            <div className="person-actions">
              <Link to={`/people/${p.id}`} className="btn btn-primary btn-action">View Details →</Link>
              <button className="btn btn-danger btn-action" onClick={() => handleDeleteClick(p.id, p.name)}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Person"
        message={`Are you sure you want to delete "${deleteModal.name}"? All related debt transactions will also be removed. This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, id: null, name: '' })}
      />
    </div>
  );
}
