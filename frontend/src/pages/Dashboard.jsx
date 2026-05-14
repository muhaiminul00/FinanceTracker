import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

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

function getMonthBounds() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return { from: `${year}-${month}-01`, to: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
}

function toNum(val) {
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getMonthBounds);

  const fetchSummary = () => {
    setLoading(true);
    const params = {};
    if (dateRange.from) params.from_date = dateRange.from;
    if (dateRange.to) params.to_date = dateRange.to;

    api.get('/dashboard/summary', { params }).then(res => {
      const data = res.data;
      // Parse all numeric fields from PostgreSQL string decimals
      data.total_balance = toNum(data.total_balance);
      data.total_income = toNum(data.total_income);
      data.total_expense = toNum(data.total_expense);
      data.total_receivable = toNum(data.total_receivable);
      data.total_payable = toNum(data.total_payable);
      data.net_worth = toNum(data.net_worth);
      data.recent_transactions = (data.recent_transactions || []).map(t => ({
        ...t,
        amount: toNum(t.amount)
      }));
      data.account_breakdown = (data.account_breakdown || []).map(a => ({
        ...a,
        balance: toNum(a.balance)
      }));
      setSummary(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, [dateRange.from, dateRange.to]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!summary) return <div className="alert alert-error">Failed to load dashboard</div>;

  const hasTransactions = summary.recent_transactions.length > 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="date-range-picker">
          <input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} />
          <span>to</span>
          <input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} />
          <button className="btn btn-small" onClick={() => setDateRange(getMonthBounds())}>This Month</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Balance</div>
          <div className="summary-value">৳{summary.total_balance.toFixed(2)}</div>
        </div>
        <div className="summary-card income">
          <div className="summary-label">Total Income</div>
          <div className="summary-value">৳{summary.total_income.toFixed(2)}</div>
          {summary.date_range?.from_date && (
            <div className="summary-period">{summary.date_range.from_date} to {summary.date_range.to_date}</div>
          )}
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

      <div className="section-header">
        <h2>Recent Transactions</h2>
        <Link to="/transactions" className="btn btn-small">View All</Link>
      </div>

      {hasTransactions ? (
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
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No transactions yet</h3>
          <p>Add your first transaction to see it here</p>
          <Link to="/transactions" className="btn btn-primary">Add Transaction</Link>
        </div>
      )}
    </div>
  );
}
