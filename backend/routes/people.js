const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM people WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
    const people = result.rows;

    const withBalances = await Promise.all(people.map(async p => {
      const receivableResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE user_id = $1 AND to_person_id = $2 AND type = 'receivable'`,
        [req.userId, p.id]
      );

      const payableResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE user_id = $1 AND from_person_id = $2 AND type = 'payable'`,
        [req.userId, p.id]
      );

      return {
        ...p,
        total_receivable: parseFloat(receivableResult.rows[0].total),
        total_payable: parseFloat(payableResult.rows[0].total),
        net_balance: parseFloat(receivableResult.rows[0].total) - parseFloat(payableResult.rows[0].total)
      };
    }));

    res.json(withBalances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const result = await db.query(
      'INSERT INTO people (user_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, phone, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const personResult = await db.query('SELECT * FROM people WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    const person = personResult.rows[0];
    if (!person) return res.status(404).json({ error: 'Person not found' });
    
    const receivableResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND to_person_id = $2 AND type = 'receivable'`,
      [req.userId, person.id]
    );
    
    const payableResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND from_person_id = $2 AND type = 'payable'`,
      [req.userId, person.id]
    );
    
    const txResult = await db.query(`
      SELECT t.*, 
        fa.name as from_account_name,
        ta.name as to_account_name
      FROM transactions t
      LEFT JOIN accounts fa ON fa.id = t.from_account_id
      LEFT JOIN accounts ta ON ta.id = t.to_account_id
      WHERE t.user_id = $1 AND (t.from_person_id = $2 OR t.to_person_id = $2)
      ORDER BY t.date DESC, t.created_at DESC
    `, [req.userId, req.params.id]);
    
    // Format dates
    const formattedTx = txResult.rows.map(row => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : row.date
    }));
    
    res.json({
      ...person,
      total_receivable: parseFloat(receivableResult.rows[0].total),
      total_payable: parseFloat(payableResult.rows[0].total),
      net_balance: parseFloat(receivableResult.rows[0].total) - parseFloat(payableResult.rows[0].total),
      transactions: formattedTx
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const result = await db.query(
      'UPDATE people SET name = $1, phone = $2, email = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, phone, email, req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Person not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM people WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Person not found' });
    res.json({ message: 'Person deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
