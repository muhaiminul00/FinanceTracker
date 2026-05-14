-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth, but we keep our own for compatibility)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('bank', 'mobile_wallet', 'cash', 'other')),
  opening_balance DECIMAL(15,2) DEFAULT 0,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- People table
CREATE TABLE IF NOT EXISTS people (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
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
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_people_user ON people(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own accounts" ON accounts
  FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Users can only see their own people" ON people
  FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Users can only see their own transactions" ON transactions
  FOR ALL USING (user_id = current_setting('app.current_user_id')::INTEGER);
