const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketSnapshot = sequelize.define('MarketSnapshot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  metro: {
    type: DataTypes.STRING,
    allowNull: false
  },
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'single_family or multi_family'
  },
  period: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: 'YYYY-MM format'
  },
  avgPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  medianPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  avgPricePerSqft: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  avgDOM: {
    type: DataTypes.DECIMAL(6, 1),
    allowNull: true
  },
  listingCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'market_snapshots',
  timestamps: true,
  indexes: [
    { fields: ['metro', 'propertyType', 'period'], unique: true },
    { fields: ['period'] }
  ]
});

module.exports = MarketSnapshot;
