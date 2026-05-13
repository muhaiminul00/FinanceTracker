const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'finance.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('bank', 'mobile_wallet', 'cash', 'other')),
    opening_balance REAL DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer', 'receivable', 'payable')),
    from_account_id INTEGER,
    to_account_id INTEGER,
    from_person_id INTEGER,
    to_person_id INTEGER,
    amount REAL NOT NULL CHECK(amount > 0),
    date TEXT NOT NULL,
    remark TEXT,
    tag TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (from_person_id) REFERENCES people(id) ON DELETE SET NULL,
    FOREIGN KEY (to_person_id) REFERENCES people(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
`);

module.exports = db;
