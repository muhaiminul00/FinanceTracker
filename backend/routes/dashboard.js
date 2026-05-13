const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/summary', (req, res) => {
  try {
    const accounts = db.prepare('SELECT id, opening_balance FROM accounts WHERE user_id = ?').all(req.userId);

    let totalBalance = 0;
    accounts.forEach(acc => {
      const incoming = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE to_account_id = ? AND type IN ('income', 'transfer', 'payable')
      `).get(acc.id).total;

      const outgoing = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE from_account_id = ? AND type IN ('expense', 'transfer', 'receivable')
      `).get(acc.id).total;

      totalBalance += acc.opening_balance + incoming - outgoing;
    });

    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'
    `).get(req.userId).total;

    const totalExpense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense'
    `).get(req.userId).total;

    const totalReceivable = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'receivable'
    `).get(req.userId).total;

    const totalPayable = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'payable'
    `).get(req.userId).total;

    const recentTransactions = db.prepare(`
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
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `).all(req.userId);

    const accountBreakdown = accounts.map(acc => {
      const incoming = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE to_account_id = ? AND type IN ('income', 'transfer', 'payable')
      `).get(acc.id).total;

      const outgoing = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
        WHERE from_account_id = ? AND type IN ('expense', 'transfer', 'receivable')
      `).get(acc.id).total;

      return {
        id: acc.id,
        balance: acc.opening_balance + incoming - outgoing
      };
    });

    res.json({
      total_balance: totalBalance,
      total_income: totalIncome,
      total_expense: totalExpense,
      total_receivable: totalReceivable,
      total_payable: totalPayable,
      net_worth: totalBalance + totalReceivable - totalPayable,
      recent_transactions: recentTransactions,
      account_breakdown: accountBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
