const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const people = db.prepare('SELECT * FROM people WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    const withBalances = people.map(p => {
      const receivable = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE user_id = ? AND to_person_id = ? AND type = 'receivable'
      `).get(req.userId, p.id).total;

      const payable = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE user_id = ? AND from_person_id = ? AND type = 'payable'
      `).get(req.userId, p.id).total;

      return {
        ...p,
        total_receivable: receivable,
        total_payable: payable,
        net_balance: receivable - payable
      };
    });
    res.json(withBalances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const stmt = db.prepare('INSERT INTO people (user_id, name, phone, email) VALUES (?, ?, ?, ?)');
    const result = stmt.run(req.userId, name, phone, email);

    res.status(201).json({ id: result.lastInsertRowid, user_id: req.userId, name, phone, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const person = db.prepare('SELECT * FROM people WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const receivable = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE user_id = ? AND to_person_id = ? AND type = 'receivable'
    `).get(req.userId, person.id).total;

    const payable = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
      WHERE user_id = ? AND from_person_id = ? AND type = 'payable'
    `).get(req.userId, person.id).total;

    const transactions = db.prepare(`
      SELECT t.*, 
        fa.name as from_account_name,
        ta.name as to_account_name
      FROM transactions t
      LEFT JOIN accounts fa ON fa.id = t.from_account_id
      LEFT JOIN accounts ta ON ta.id = t.to_account_id
      WHERE t.user_id = ? AND (t.from_person_id = ? OR t.to_person_id = ?)
      ORDER BY t.date DESC, t.created_at DESC
    `).all(req.userId, req.params.id, req.params.id);

    res.json({
      ...person,
      total_receivable: receivable,
      total_payable: payable,
      net_balance: receivable - payable,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const person = db.prepare('SELECT * FROM people WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    db.prepare('UPDATE people SET name = ?, phone = ?, email = ? WHERE id = ? AND user_id = ?')
      .run(name, phone, email, req.params.id, req.userId);

    res.json({ id: Number(req.params.id), name, phone, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM people WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Person not found' });
    res.json({ message: 'Person deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
