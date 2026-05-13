const express = require('express');
const db = require('../db');
const router = express.Router();

function getAccountBalance(accountId) {
  const result = db.prepare(`
    SELECT 
      (SELECT COALESCE(opening_balance, 0) FROM accounts WHERE id = ?) +
      COALESCE((SELECT SUM(amount) FROM transactions WHERE to_account_id = ? AND type IN ('income', 'transfer', 'payable')), 0) -
      COALESCE((SELECT SUM(amount) FROM transactions WHERE from_account_id = ? AND type IN ('expense', 'transfer', 'receivable')), 0)
      as balance
  `).get(accountId, accountId, accountId);
  return result ? result.balance : 0;
}

router.get('/', (req, res) => {
  try {
    const { account_id, type, tag, from_date, to_date } = req.query;
    let sql = `
      SELECT t.*, 
        fa.name as from_account_name,
        ta.name as to_account_name,
        fp.name as from_person_name,
        tp.name as to_person_name
      FROM transactions t
      LEFT JOIN accounts fa ON fa.id = t.from_account_id
      LEFT JOIN accounts ta ON ta.id = t.to_account_id
      LEFT JOIN people fp ON fp.id = t.from_person_id
      LEFT JOIN people tp ON tp.id = t.to_person_id
      WHERE t.user_id = ?
    `;
    const params = [req.userId];

    if (account_id) {
      sql += ` AND (t.from_account_id = ? OR t.to_account_id = ?)`;
      params.push(account_id, account_id);
    }
    if (type) {
      sql += ` AND t.type = ?`;
      params.push(type);
    }
    if (tag) {
      sql += ` AND t.tag = ?`;
      params.push(tag);
    }
    if (from_date) {
      sql += ` AND t.date >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      sql += ` AND t.date <= ?`;
      params.push(to_date);
    }

    sql += ` ORDER BY t.date DESC, t.created_at DESC`;

    const transactions = db.prepare(sql).all(...params);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { type, from_account_id, to_account_id, from_person_id, to_person_id, amount, date, remark, tag } = req.body;

    if (!type || !amount || !date) return res.status(400).json({ error: 'Type, amount, and date required' });
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

    if (type === 'income' && !to_account_id) return res.status(400).json({ error: 'Income requires destination account' });
    if (type === 'expense' && !from_account_id) return res.status(400).json({ error: 'Expense requires source account' });
    if (type === 'transfer' && (!from_account_id || !to_account_id)) return res.status(400).json({ error: 'Transfer requires both accounts' });
    if (type === 'receivable' && (!from_account_id || !to_person_id)) return res.status(400).json({ error: 'Receivable requires source account and destination person' });
    if (type === 'payable' && (!from_person_id || !to_account_id)) return res.status(400).json({ error: 'Payable requires source person and destination account' });

    if (from_account_id) {
      const acc = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(from_account_id, req.userId);
      if (!acc) return res.status(400).json({ error: 'Invalid source account' });
    }
    if (to_account_id) {
      const acc = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(to_account_id, req.userId);
      if (!acc) return res.status(400).json({ error: 'Invalid destination account' });
    }
    if (from_account_id && to_account_id && from_account_id === to_account_id) {
      return res.status(400).json({ error: 'Source and destination accounts cannot be the same' });
    }

    if (from_person_id) {
      const p = db.prepare('SELECT * FROM people WHERE id = ? AND user_id = ?').get(from_person_id, req.userId);
      if (!p) return res.status(400).json({ error: 'Invalid source person' });
    }
    if (to_person_id) {
      const p = db.prepare('SELECT * FROM people WHERE id = ? AND user_id = ?').get(to_person_id, req.userId);
      if (!p) return res.status(400).json({ error: 'Invalid destination person' });
    }

    if (from_account_id && ['expense', 'transfer', 'receivable'].includes(type)) {
      const balance = getAccountBalance(from_account_id);
      if (balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance in source account' });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, type, from_account_id, to_account_id, from_person_id, to_person_id, amount, date, remark, tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.userId, type, from_account_id || null, to_account_id || null, from_person_id || null, to_person_id || null, amount, date, remark || null, tag || null);

    const transaction = db.prepare(`
      SELECT t.*, 
        fa.name as from_account_name,
        ta.name as to_account_name,
        fp.name as from_person_name,
        tp.name as to_person_name
      FROM transactions t
      LEFT JOIN accounts fa ON fa.id = t.from_account_id
      LEFT JOIN accounts ta ON ta.id = t.to_account_id
      LEFT JOIN people fp ON fp.id = t.from_person_id
      LEFT JOIN people tp ON tp.id = t.to_person_id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
