import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function People() {
  const [people, setPeople] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const fetchPeople = () => {
    api.get('/people').then(res => setPeople(res.data));
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/people', form);
    setShowForm(false);
    setForm({ name: '', phone: '', email: '' });
    fetchPeople();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this person?')) return;
    await api.delete(`/people/${id}`);
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
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Person</button>
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
                <span>They owe you</span>
                <strong>৳{p.total_receivable?.toFixed(2)}</strong>
              </div>
              <div className="balance-item payable">
                <span>You owe them</span>
                <strong>৳{p.total_payable?.toFixed(2)}</strong>
              </div>
              <div className={`balance-item ${p.net_balance >= 0 ? 'positive' : 'negative'}`}>
                <span>Net</span>
                <strong>৳{p.net_balance?.toFixed(2)}</strong>
              </div>
            </div>
            <div className="person-actions">
              <Link to={`/people/${p.id}`} className="btn btn-small">View</Link>
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
