const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL || 'https://intel.8-palms.com']
    : '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const sequelize = require('./config/database');
require('./models/index');

sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection error:', err));

// Auto-create tables
sequelize.sync({ alter: true })
  .then(() => console.log('Tables synced'))
  .catch(err => console.error('Sync error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/homes', require('./routes/homes'));
app.use('/api/retail', require('./routes/retail'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '8 Palms Homes Intel API running' });
});

// Serve React client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: { message: err.message || 'Internal Server Error' }
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`8 Palms Intel server running on port ${PORT}`);

  // Start the retail search scheduler in production
  if (process.env.NODE_ENV === 'production') {
    const { startScheduler } = require('./services/schedulerService');
    startScheduler();
  }
});
