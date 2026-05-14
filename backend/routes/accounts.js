const express = require('express');
const db = require('../db');
const router = express.Router();

async function getAccountBalance(accountId) {
  const accResult = await db.query('SELECT COALESCE(opening_balance, 0) as opening FROM accounts WHERE id = $1', [accountId]);
  const opening = accResult.rows[0]?.opening || 0;

  const incomingResult = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
     WHERE to_account_id = $1 AND type IN ('income', 'transfer', 'payable')`,
    [accountId]
  );
  const incoming = parseFloat(incomingResult.rows[0].total);

  const outgoingResult = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
     WHERE from_account_id = $1 AND type IN ('expense', 'transfer', 'receivable')`,
    [accountId]
  );
  const outgoing = parseFloat(outgoingResult.rows[0].total);

  return opening + incoming - outgoing;
}

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    const accounts = result.rows;

    const withBalances = await Promise.all(accounts.map(async acc => ({
      ...acc,
      current_balance: await getAccountBalance(acc.id)
    })));

    res.json(withBalances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, opening_balance, color, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });

    const result = await db.query(
      `INSERT INTO accounts (user_id, name, type, opening_balance, color, icon) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, name, type, opening_balance || 0, color, icon]
    );

    res.status(201).json({ 
      ...result.rows[0],
      current_balance: opening_balance || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const accResult = await db.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    const account = accResult.rows[0];
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const txResult = await db.query(`
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
      WHERE t.user_id = $1 AND (t.from_account_id = $2 OR t.to_account_id = $2)
      ORDER BY t.date DESC, t.created_at DESC
    `, [req.userId, req.params.id]);

    res.json({
      ...account,
      current_balance: await getAccountBalance(account.id),
      transactions: txResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, opening_balance, color, icon } = req.body;
    const result = await db.query(
      'UPDATE accounts SET name = $1, type = $2, opening_balance = $3, color = $4, icon = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [name, type, opening_balance, color, icon, req.params.id, req.userId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Account not found' });

    res.json({ 
      ...result.rows[0],
      current_balance: await getAccountBalance(Number(req.params.id))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
