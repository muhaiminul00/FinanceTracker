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
    const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    const withBalances = accounts.map(acc => ({
      ...acc,
      current_balance: getAccountBalance(acc.id)
    }));
    res.json(withBalances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, type, opening_balance, color, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });

    const stmt = db.prepare(`
      INSERT INTO accounts (user_id, name, type, opening_balance, color, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.userId, name, type, opening_balance || 0, color, icon);

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      user_id: req.userId,
      name, type, opening_balance: opening_balance || 0, color, icon,
      current_balance: opening_balance || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const transactions = db.prepare(`
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
      WHERE t.user_id = ? AND (t.from_account_id = ? OR t.to_account_id = ?)
      ORDER BY t.date DESC, t.created_at DESC
    `).all(req.userId, req.params.id, req.params.id);

    res.json({
      ...account,
      current_balance: getAccountBalance(account.id),
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, type, opening_balance, color, icon } = req.body;
    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const stmt = db.prepare(`
      UPDATE accounts SET name = ?, type = ?, opening_balance = ?, color = ?, icon = ?
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(name, type, opening_balance, color, icon, req.params.id, req.userId);

    res.json({ 
      id: Number(req.params.id), 
      name, type, opening_balance, color, icon,
      current_balance: getAccountBalance(Number(req.params.id))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
