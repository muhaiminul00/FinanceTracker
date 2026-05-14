const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper to run queries
const db = {
  query: (text, params) => pool.query(text, params),

  // For parameterized queries with multiple values
  prepare: (text) => ({
    get: async (...params) => {
      const result = await pool.query(text, params);
      return result.rows[0] || null;
    },
    all: async (...params) => {
      const result = await pool.query(text, params);
      return result.rows;
    },
    run: async (...params) => {
      const result = await pool.query(text, params);
      return { 
        changes: result.rowCount,
        lastInsertRowid: result.rows[0]?.id || null
      };
    }
  }),

  // Initialize tables
  init: async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('bank', 'mobile_wallet', 'cash', 'other')),
        opening_balance DECIMAL(15,2) DEFAULT 0,
        color TEXT,
        icon TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS people (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer', 'receivable', 'payable')),
        from_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
        to_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
        from_person_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
        to_person_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
        amount DECIMAL(15,2) NOT NULL CHECK(amount > 0),
        date DATE NOT NULL,
        remark TEXT,
        tag TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_people_user ON people(user_id)`);

    console.log('Database initialized');
  }
};

module.exports = db;
