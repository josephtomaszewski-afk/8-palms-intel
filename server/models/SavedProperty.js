const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedProperty = sequelize.define('SavedProperty', {
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
  savedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Display label like "Saved by Joe"'
  }
}, {
  tableName: 'saved_properties',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'homeListingId'], unique: true },
    { fields: ['homeListingId'] }
  ]
});

module.exports = SavedProperty;
