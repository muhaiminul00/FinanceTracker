# Personal Finance & Multi-Account Expense Tracker

A full-stack personal finance web application to track income, expenses, transfers, receivables, and payables across multiple accounts.

## Features

- **Authentication**: JWT-based login/register
- **Multi-Account Support**: Bank, Mobile Wallet, Cash, and Other account types
- **Transaction System**: Income, Expense, Transfer, Receivable, Payable
- **Automatic Balance Calculation**: All balances computed from transactions + opening balance
- **People/Debt Tracking**: Track who owes you and who you owe
- **Dashboard Summary**: Total balance, income, expense, receivable, payable, net worth
- **Filtering**: Filter transactions by type, account, date range
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken, cors
- **Frontend**: React 18, Vite, React Router, Axios
- **Database**: SQLite (file-based, zero config)

## Project Structure

```
finance-tracker/
├── backend/
│   ├── server.js          # Express server entry
│   ├── db.js              # SQLite database & schema
│   ├── middleware/
│   │   └── auth.js        # JWT verification
│   ├── routes/
│   │   ├── auth.js        # Login/register
│   │   ├── accounts.js    # Account CRUD + balances
│   │   ├── transactions.js # Transaction CRUD + validation
│   │   ├── people.js      # People/debt tracking
│   │   └── dashboard.js   # Summary stats
│   ├── .env.example       # Environment template
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── api.js
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   └── Navbar.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── Accounts.jsx
│           ├── AccountDetail.jsx
│           ├── Transactions.jsx
│           ├── People.jsx
│           └── PersonDetail.jsx
└── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and set a secure JWT_SECRET
# PORT=5000
# JWT_SECRET=your-super-secret-key-here

# Start development server
npm run dev

# Or start production server
npm start
```

The backend will:
- Create `finance.db` (SQLite) automatically on first run
- Start on port 5000 by default
- Enable CORS for frontend communication

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server (with proxy to backend)
npm run dev
```

The frontend will:
- Start on port 3000
- Proxy API requests to `http://localhost:5000`
- Auto-reload on file changes

### 3. Build for Production

```bash
cd frontend
npm run build
```

Then serve the `frontend/dist` folder via the backend (set `NODE_ENV=production` in backend `.env`).

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - List all accounts (with current_balance)
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account + transaction history
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions (supports ?type, ?account_id, ?tag, ?from_date, ?to_date)
- `POST /api/transactions` - Create transaction
- `DELETE /api/transactions/:id` - Delete transaction

### People
- `GET /api/people` - List people (with debt balances)
- `POST /api/people` - Create person
- `GET /api/people/:id` - Get person + related transactions
- `PUT /api/people/:id` - Update person
- `DELETE /api/people/:id` - Delete person

### Dashboard
- `GET /api/dashboard/summary` - Financial summary + recent transactions

## Transaction Types Explained

| Type | From | To | Effect |
|------|------|-----|--------|
| **Income** | Outside | Account | +Balance to account |
| **Expense** | Account | Outside | -Balance from account |
| **Transfer** | Account A | Account B | -A, +B (no net change) |
| **Receivable** | Account | Person | -Account balance, person owes you |
| **Payable** | Person | Account | +Account balance, you owe person |

## Important Rules

1. **User adds transactions only once** — everything else updates automatically
2. **Balances are calculated from transactions** — never manually edit current balances
3. **Transfers are not expenses** — they only move money between your accounts
4. **Receivable/Payable are transaction types** — no separate debt system needed

## Deployment Options

### Option A: Self-hosted (VPS/Raspberry Pi)
1. Clone/upload code
2. Run `npm install` in both folders
3. Use PM2 or systemd to keep backend running
4. Serve frontend via backend static files (production mode)
5. Use Nginx reverse proxy with SSL

### Option B: Separate Hosting
- **Backend**: Railway, Render, Fly.io (Node.js + SQLite persistent disk)
- **Frontend**: Vercel, Netlify, GitHub Pages (build static files)
- Update `VITE_API_URL` in frontend `.env` to point to backend

### Option C: Docker (future enhancement)
A Dockerfile can be added to containerize both services.

## Security Notes

- Change `JWT_SECRET` to a long random string in production
- SQLite is file-based — ensure `finance.db` is backed up regularly
- The app uses bcrypt for password hashing
- CORS is open in development — restrict in production

## Backup

Simply copy the `backend/finance.db` file to backup all your data. SQLite databases are single-file and portable.

## Future Enhancements (V2+)

- Monthly/yearly reports
- Charts and analytics
- Budget planning
- Recurring transactions
- CSV export
- Multi-currency support
- Receipt image attachments
