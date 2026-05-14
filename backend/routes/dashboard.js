const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let dateFilter = '';
    let dateParams = [];

    if (from_date && to_date) {
      dateFilter = ' AND date >= $2 AND date <= $3';
      dateParams = [from_date, to_date];
    } else if (from_date) {
      dateFilter = ' AND date >= $2';
      dateParams = [from_date];
    } else if (to_date) {
      dateFilter = ' AND date <= $2';
      dateParams = [to_date];
    }

    const accountsResult = await db.query('SELECT id, opening_balance FROM accounts WHERE user_id = $1', [req.userId]);
    const accounts = accountsResult.rows;

    let totalBalance = 0;
    for (const acc of accounts) {
      const incomingResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE to_account_id = $1 AND type IN ('income', 'transfer', 'payable')`,
        [acc.id]
      );

      const outgoingResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE from_account_id = $1 AND type IN ('expense', 'transfer', 'receivable')`,
        [acc.id]
      );

      totalBalance += parseFloat(acc.opening_balance) + parseFloat(incomingResult.rows[0].total) - parseFloat(outgoingResult.rows[0].total);
    }

    const totalIncomeResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'income' ${dateFilter}`,
      [req.userId, ...dateParams]
    );

    const totalExpenseResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'expense' ${dateFilter}`,
      [req.userId, ...dateParams]
    );

    const totalReceivableResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'receivable' ${dateFilter}`,
      [req.userId, ...dateParams]
    );

    const totalPayableResult = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
       WHERE user_id = $1 AND type = 'payable' ${dateFilter}`,
      [req.userId, ...dateParams]
    );

    const recentTxResult = await db.query(`
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
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 10
    `, [req.userId]);

    const accountBreakdown = await Promise.all(accounts.map(async acc => {
      const incomingResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE to_account_id = $1 AND type IN ('income', 'transfer', 'payable')`,
        [acc.id]
      );

      const outgoingResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions 
         WHERE from_account_id = $1 AND type IN ('expense', 'transfer', 'receivable')`,
        [acc.id]
      );

      return {
        id: acc.id,
        balance: parseFloat(acc.opening_balance) + parseFloat(incomingResult.rows[0].total) - parseFloat(outgoingResult.rows[0].total)
      };
    }));
    
    // At the end of the GET /summary route, before res.json():
    const formattedTx = recentTxResult.rows.map(row => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : row.date
    }));
    
    res.json({
      ...
      recent_transactions: formattedTx,
      ...
    });
    
    res.json({
      total_balance: totalBalance,
      total_income: parseFloat(totalIncomeResult.rows[0].total),
      total_expense: parseFloat(totalExpenseResult.rows[0].total),
      total_receivable: parseFloat(totalReceivableResult.rows[0].total),
      total_payable: parseFloat(totalPayableResult.rows[0].total),
      net_worth: totalBalance + parseFloat(totalReceivableResult.rows[0].total) - parseFloat(totalPayableResult.rows[0].total),
      recent_transactions: recentTxResult.rows,
      account_breakdown: accountBreakdown,
      date_range: { from_date: from_date || null, to_date: to_date || null }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
