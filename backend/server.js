require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const peopleRoutes = require('./routes/people');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/accounts', authMiddleware, accountRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/people', authMiddleware, peopleRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Serve frontend in production ONLY if dist folder exists
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => {
      res.json({ message: 'Finance Tracker API is running', status: 'ok' });
    });
  }
}

const PORT = process.env.PORT || 5000;

// Initialize database then start server
db.init().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
