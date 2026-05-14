import { useState, useEffect } from 'react';
import api from '../api';
import ConfirmModal from '../components/ConfirmModal';

const typeColors = {
  income: '#34d399',
  expense: '#f87171',
  transfer: '#60a5fa',
  receivable: '#fb923c',
  payable: '#c084fc'
};

const typeLabels = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  receivable: 'Receivable',
  payable: 'Payable'
};

const commonTags = ['Food', 'Travel', 'Recharge', 'Subscription', 'Education', 'Shopping', 'Salary', 'Freelance', 'Medical', 'Rent', 'Other'];

function toNum(val) {
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [people, setPeople] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ type: '', account_id: '', tag: '', from_date: '', to_date: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, desc: '' });

  const [form, setForm] = useState({
    type: 'expense',
    from_account_id: '',
    to_account_id: '',
    from_person_id: '',
    to_person_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remark: '',
    tag: ''
  });

  const fetchData = () => {
    api.get('/accounts').then(res => setAccounts(res.data));
    api.get('/people').then(res => setPeople(res.data));
    fetchTransactions();
  };

  const fetchTransactions = () => {
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.account_id) params.account_id = filters.account_id;
    if (filters.tag) params.tag = filters.tag;
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;

    api.get('/transactions', { params }).then(res => {
      const parsed = res.data.map(t => ({
        ...t,
        amount: toNum(t.amount)
      }));
      setTransactions(parsed);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', {
        ...form,
        amount: parseFloat(form.amount),
        from_account_id: form.from_account_id ? parseInt(form.from_account_id) : null,
        to_account_id: form.to_account_id ? parseInt(form.to_account_id) : null,
        from_person_id: form.from_person_id ? parseInt(form.from_person_id) : null,
        to_person_id: form.to_person_id ? parseInt(form.to_person_id) : null,
      });
      setShowForm(false);
      setForm({
        type: 'expense',
        from_account_id: '',
        to_account_id: '',
        from_person_id: '',
        to_person_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remark: '',
        tag: ''
      });
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create transaction');
    }
  };

  const handleDeleteClick = (t) => {
    const desc = `৳${t.amount.toFixed(2)} ${typeLabels[t.type]} (${t.remark || 'no remark'})`;
    setDeleteModal({ open: true, id: t.id, desc });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.id) return;
    await api.delete(`/transactions/${deleteModal.id}`);
    setDeleteModal({ open: false, id: null, desc: '' });
    fetchTransactions();
  };

  const getFormFields = () => {
    switch (form.type) {
      case 'income':
        return (
          <div className="form-group">
            <label>To Account</label>
            <select value={form.to_account_id} onChange={e => setForm({...form, to_account_id: e.target.value})} required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        );
      case 'expense':
        return (
          <div className="form-group">
            <label>From Account</label>
            <select value={form.from_account_id} onChange={e => setForm({...form, from_account_id: e.target.value})} required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        );
      case 'transfer':
        return (
          <>
            <div className="form-group">
              <label>From Account</label>
              <select value={form.from_account_id} onChange={e => setForm({...form, from_account_id: e.target.value})} required>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To Account</label>
              <select value={form.to_account_id} onChange={e => setForm({...form, to_account_id: e.target.value})} required>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        );
      case 'receivable':
        return (
          <>
            <div className="form-group">
              <label>From Account (you gave)</label>
              <select value={form.from_account_id} onChange={e => setForm({...form, from_account_id: e.target.value})} required>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To Person (who owes you)</label>
              <select value={form.to_person_id} onChange={e => setForm({...form, to_person_id: e.target.value})} required>
                <option value="">Select person</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </>
        );
      case 'payable':
        return (
          <>
            <div className="form-group">
              <label>From Person (who gave you)</label>
              <select value={form.from_person_id} onChange={e => setForm({...form, from_person_id: e.target.value})} required>
                <option value="">Select person</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To Account (you received)</label>
              <select value={form.to_account_id} onChange={e => setForm({...form, to_account_id: e.target.value})} required>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>New Transaction</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required placeholder="0.00" />
              </div>
            </div>
            <div className="form-row">
              {getFormFields()}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Tag / Category</label>
                <input list="tags" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} placeholder="Select or type..." />
                <datalist id="tags">
                  {commonTags.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>
            <div className="form-group">
              <label>Remark</label>
              <input value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} placeholder="Optional note..." />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save Transaction</button>
          </form>
        </div>
      )}

      <div className="filters">
        <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
          <option value="">All Types</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={filters.account_id} onChange={e => setFilters({...filters, account_id: e.target.value})}>
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input type="date" value={filters.from_date} onChange={e => setFilters({...filters, from_date: e.target.value})} placeholder="From" />
        <input type="date" value={filters.to_date} onChange={e => setFilters({...filters, to_date: e.target.value})} placeholder="To" />
        <button className="btn btn-small" onClick={() => setFilters({ type: '', account_id: '', tag: '', from_date: '', to_date: '' })}>Clear</button>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💸</div>
          <h3>No transactions yet</h3>
          <p>Add your first transaction to get started</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Transaction</button>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Tag</th>
                  <th>Remark</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>
                      <span className="badge" style={{ background: typeColors[t.type], color: '#fff' }}>
                        {typeLabels[t.type]}
                      </span>
                    </td>
                    <td>{t.from_account_name || t.from_person_name || '—'}</td>
                    <td>{t.to_account_name || t.to_person_name || '—'}</td>
                    <td className="amount">৳{t.amount.toFixed(2)}</td>
                    <td>{t.tag || '—'}</td>
                    <td>{t.remark || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-action" onClick={() => handleDeleteClick(t)}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction? ${deleteModal.desc}. This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, id: null, desc: '' })}
      />
    </div>
  );
}
