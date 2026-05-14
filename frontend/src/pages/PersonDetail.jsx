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

function toNum(val) {
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export default function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);

  useEffect(() => {
    api.get(`/people/${id}`).then(res => {
      const data = res.data;
      data.total_receivable = toNum(data.total_receivable);
      data.total_payable = toNum(data.total_payable);
      data.net_balance = toNum(data.net_balance);
      data.transactions = (data.transactions || []).map(t => ({
        ...t,
        amount: toNum(t.amount)
      }));
      setPerson(data);
    });
  }, [id]);

  if (!person) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/people">← People</Link>
      </div>
      <div className="page-header">
        <h1>{person.name}</h1>
      </div>
      <div className="person-balances-large">
        <div className="balance-card receivable">
          <div>They owe you</div>
          <div className="balance-amount">৳{person.total_receivable.toFixed(2)}</div>
        </div>
        <div className="balance-card payable">
          <div>You owe them</div>
          <div className="balance-amount">৳{person.total_payable.toFixed(2)}</div>
        </div>
        <div className={`balance-card ${person.net_balance >= 0 ? 'positive' : 'negative'}`}>
          <div>Net Balance</div>
          <div className="balance-amount">৳{person.net_balance.toFixed(2)}</div>
        </div>
      </div>

      <h2>Transaction History</h2>
      <div className="table-wrapper">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {person.transactions?.map(t => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>
                    <span className="badge" style={{ background: typeColors[t.type], color: '#fff' }}>
                      {typeLabels[t.type]}
                    </span>
                  </td>
                  <td>{t.from_account_name || t.to_account_name || '—'}</td>
                  <td className="amount">৳{t.amount.toFixed(2)}</td>
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
