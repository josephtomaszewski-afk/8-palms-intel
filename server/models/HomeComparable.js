const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HomeComparable = sequelize.define('HomeComparable', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  homeListingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'home_listings',
      key: 'id'
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  soldPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  soldDate: {
    type: DataTypes.DATE,
    allowNull: true
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
  pricePerSqft: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  distance: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Distance in miles from subject property'
  },
  yearBuilt: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'home_comparables',
  timestamps: true,
  indexes: [
    { fields: ['homeListingId'] },
    { fields: ['soldDate'] }
  ]
});

module.exports = HomeComparable;
