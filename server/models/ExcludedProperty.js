const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExcludedProperty = sequelize.define('ExcludedProperty', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  homeListingId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  excludedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Display label like "Excluded by Joe"'
  }
}, {
  tableName: 'excluded_properties',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'homeListingId'], unique: true },
    { fields: ['homeListingId'] }
  ]
});

module.exports = ExcludedProperty;
