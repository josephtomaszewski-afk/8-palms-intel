const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RetailListing = sequelize.define('RetailListing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: false,
    defaultValue: 'FL'
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  propertyType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'retail',
    comment: 'retail, restaurant, strip_mall, etc.'
  },
  propertySubtype: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'More specific type: freestanding, end_cap, inline, etc.'
  },
  sqft: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lotSize: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true
  },
  yearBuilt: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  pricePerSqft: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  capRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Cap rate percentage'
  },
  noi: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Net Operating Income'
  },
  daysOnMarket: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    comment: 'Extracted keywords: grease trap, drive-thru, etc.'
  },
  tenantInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Current tenant information if leased'
  },
  leaseType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'NNN, gross, modified gross, etc.'
  },
  occupancy: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'occupied, vacant, partially occupied'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'loopnet'
  },
  sourceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  listingStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'for_sale'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'retail_listings',
  timestamps: true,
  indexes: [
    { fields: ['city', 'state'] },
    { fields: ['state'] },
    { fields: ['propertyType'] },
    { fields: ['price'] },
    { fields: ['isActive'] },
    { fields: ['sourceId'], unique: true },
    { fields: ['keywords'], using: 'gin' }
  ]
});

module.exports = RetailListing;
