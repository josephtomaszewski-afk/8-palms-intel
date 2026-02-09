const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomeListing = sequelize.define('HomeListing', {
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
    comment: 'single_family, multi_family, duplex, triplex, quadplex'
  },
  beds: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  baths: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true
  },
  sqft: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lotSize: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: true,
    comment: 'Lot size in sqft'
  },
  yearBuilt: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stories: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  garage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  originalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  pricePerSqft: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  estimatedRent: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  rentalYield: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Annual rental yield as percentage'
  },
  daysOnMarket: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  priceReductions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  priceReductionAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  metro: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Tampa, Orlando, or Jacksonville'
  },
  neighborhood: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dealScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  scoreBreakdown: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'realtor'
  },
  sourceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  sourceId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Property listing description text'
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
  tableName: 'home_listings',
  timestamps: true,
  indexes: [
    { fields: ['latitude', 'longitude'] },
    { fields: ['city', 'state'] },
    { fields: ['metro'] },
    { fields: ['beds'] },
    { fields: ['propertyType'] },
    { fields: ['dealScore'] },
    { fields: ['price'] },
    { fields: ['isActive'] },
    { fields: ['sourceId'], unique: true }
  ]
});

module.exports = HomeListing;
