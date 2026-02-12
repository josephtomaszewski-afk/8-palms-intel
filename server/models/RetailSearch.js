const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RetailSearch = sequelize.define('RetailSearch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'User-friendly name for the search, e.g. "Miami Restaurant Search"'
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Original natural language query from user'
  },
  parsedCriteria: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Structured search criteria parsed by Claude: { state, cities, keywords, priceMin, priceMax, sqftMin, sqftMax, propertySubtype }'
  },
  notifyEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Send email notifications for new matches'
  },
  notifySms: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Send SMS notifications for new matches'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this search is active and should run daily'
  },
  lastRunAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this search was last executed'
  },
  lastNotifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When user was last notified of results'
  },
  matchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of listings that match this search'
  }
}, {
  tableName: 'retail_searches',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['isActive'] },
    { fields: ['lastRunAt'] }
  ]
});

module.exports = RetailSearch;
