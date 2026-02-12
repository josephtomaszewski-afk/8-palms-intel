const sequelize = require('../config/database');
const User = require('./User');
const HomeListing = require('./HomeListing');
const HomeComparable = require('./HomeComparable');
const MarketSnapshot = require('./MarketSnapshot');
const SavedProperty = require('./SavedProperty');
const ExcludedProperty = require('./ExcludedProperty');
const RetailListing = require('./RetailListing');
const RetailSearch = require('./RetailSearch');
const RetailSearchResult = require('./RetailSearchResult');

// Associations
HomeListing.hasMany(HomeComparable, { foreignKey: 'homeListingId', as: 'comparables' });
HomeComparable.belongsTo(HomeListing, { foreignKey: 'homeListingId' });

SavedProperty.belongsTo(User, { foreignKey: 'userId' });
SavedProperty.belongsTo(HomeListing, { foreignKey: 'homeListingId' });
User.hasMany(SavedProperty, { foreignKey: 'userId' });
HomeListing.hasMany(SavedProperty, { foreignKey: 'homeListingId' });

ExcludedProperty.belongsTo(User, { foreignKey: 'userId' });
ExcludedProperty.belongsTo(HomeListing, { foreignKey: 'homeListingId' });
User.hasMany(ExcludedProperty, { foreignKey: 'userId' });
HomeListing.hasMany(ExcludedProperty, { foreignKey: 'homeListingId' });

// Retail Search associations
RetailSearch.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RetailSearch, { foreignKey: 'userId' });

RetailSearchResult.belongsTo(RetailSearch, { foreignKey: 'retailSearchId' });
RetailSearchResult.belongsTo(RetailListing, { foreignKey: 'retailListingId' });
RetailSearch.hasMany(RetailSearchResult, { foreignKey: 'retailSearchId' });
RetailListing.hasMany(RetailSearchResult, { foreignKey: 'retailListingId' });

const models = {
  User, HomeListing, HomeComparable, MarketSnapshot, SavedProperty, ExcludedProperty,
  RetailListing, RetailSearch, RetailSearchResult
};

const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database sync error:', error);
    throw error;
  }
};

module.exports = { sequelize, syncDatabase, ...models };
