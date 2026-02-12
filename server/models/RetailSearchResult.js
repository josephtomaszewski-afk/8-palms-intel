const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RetailSearchResult = sequelize.define('RetailSearchResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  retailSearchId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'retail_searches',
      key: 'id'
    }
  },
  retailListingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'retail_listings',
      key: 'id'
    }
  },
  matchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'When this listing first matched the search'
  },
  notifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When user was notified about this match'
  },
  isNew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this is a new match not yet seen by user'
  },
  isViewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether user has viewed this result'
  }
}, {
  tableName: 'retail_search_results',
  timestamps: true,
  indexes: [
    { fields: ['retailSearchId'] },
    { fields: ['retailListingId'] },
    { fields: ['retailSearchId', 'retailListingId'], unique: true },
    { fields: ['isNew'] },
    { fields: ['matchedAt'] }
  ]
});

module.exports = RetailSearchResult;
