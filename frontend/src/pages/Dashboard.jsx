import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const typeColors = {
  income: '#10b981',
  expense: '#ef4444',
  transfer: '#3b82f6',
  receivable: '#f97316',
  payable: '#a855f7'
};

const typeLabels = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  receivable: 'Receivable',
  payable: 'Payable'
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary').then(res => {
      setSummary(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (!summary) return <div className="alert alert-error">Failed to load dashboard</div>;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Balance</div>
          <div className="summary-value">৳{summary.total_balance.toFixed(2)}</div>
        </div>
        <div className="summary-card income">
          <div className="summary-label">Total Income</div>
          <div className="summary-value">৳{summary.total_income.toFixed(2)}</div>
        </div>
        <div className="summary-card expense">
          <div className="summary-label">Total Expense</div>
          <div className="summary-value">৳{summary.total_expense.toFixed(2)}</div>
        </div>
        <div className="summary-card receivable">
          <div className="summary-label">Total Receivable</div>
          <div className="summary-value">৳{summary.total_receivable.toFixed(2)}</div>
        </div>
        <div className="summary-card payable">
          <div className="summary-label">Total Payable</div>
          <div className="summary-value">৳{summary.total_payable.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Net Worth</div>
          <div className="summary-value">৳{summary.net_worth.toFixed(2)}</div>
        </div>
      </div>

      <h2>Recent Transactions</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {summary.recent_transactions.map(t => (
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
                <td>{t.remark || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
