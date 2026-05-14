import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

export default function AccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    api.get(`/accounts/${id}`).then(res => setAccount(res.data));
  }, [id]);

  if (!account) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/accounts">← Accounts</Link>
      </div>
      <div className="page-header">
        <h1>{account.name}</h1>
        <div className="account-balance-large">৳{account.current_balance?.toFixed(2)}</div>
      </div>
      <div className="account-meta">
        <span className="badge">{account.type}</span>
        <span>Opening: ৳{account.opening_balance?.toFixed(2)}</span>
      </div>

      <h2>Transaction History</h2>
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
              </tr>
            </thead>
            <tbody>
              {account.transactions?.map(t => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
