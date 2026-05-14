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
      WHERE t.user_id = $1
    `;
    const params = [req.userId];
    let paramIndex = 2;

    if (account_id) {
      sql += ` AND (t.from_account_id = $${paramIndex} OR t.to_account_id = $${paramIndex})`;
      params.push(account_id);
      paramIndex++;
    }
    if (type) {
      sql += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    if (tag) {
      sql += ` AND t.tag = $${paramIndex}`;
      params.push(tag);
      paramIndex++;
    }
    if (from_date) {
      sql += ` AND t.date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    if (to_date) {
      sql += ` AND t.date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    sql += ` ORDER BY t.date DESC, t.created_at DESC`;
    // At the end of the GET / route, before res.json():
    const formatted = result.rows.map(row => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : row.date
    }));
    res.json(formatted);
    
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
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
      const acc = await db.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [from_account_id, req.userId]);
      if (acc.rows.length === 0) return res.status(400).json({ error: 'Invalid source account' });
    }
    if (to_account_id) {
      const acc = await db.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [to_account_id, req.userId]);
      if (acc.rows.length === 0) return res.status(400).json({ error: 'Invalid destination account' });
    }
    if (from_account_id && to_account_id && from_account_id === to_account_id) {
      return res.status(400).json({ error: 'Source and destination accounts cannot be the same' });
    }

    if (from_person_id) {
      const p = await db.query('SELECT * FROM people WHERE id = $1 AND user_id = $2', [from_person_id, req.userId]);
      if (p.rows.length === 0) return res.status(400).json({ error: 'Invalid source person' });
    }
    if (to_person_id) {
      const p = await db.query('SELECT * FROM people WHERE id = $1 AND user_id = $2', [to_person_id, req.userId]);
      if (p.rows.length === 0) return res.status(400).json({ error: 'Invalid destination person' });
    }

    if (from_account_id && ['expense', 'transfer', 'receivable'].includes(type)) {
      const balance = await getAccountBalance(from_account_id);
      if (balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance in source account' });
      }
    }

    const result = await db.query(
      `INSERT INTO transactions (user_id, type, from_account_id, to_account_id, from_person_id, to_person_id, amount, date, remark, tag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.userId, type, from_account_id || null, to_account_id || null, from_person_id || null, to_person_id || null, amount, date, remark || null, tag || null]
    );

    const transaction = result.rows[0];

    // Get names
    const namesResult = await db.query(`
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
      WHERE t.id = $1
    `, [transaction.id]);

    res.status(201).json(namesResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
