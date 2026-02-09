const { Op } = require('sequelize');
const HomeListing = require('../models/HomeListing');
const HomeComparable = require('../models/HomeComparable');
const MarketSnapshot = require('../models/MarketSnapshot');
const SavedProperty = require('../models/SavedProperty');
const ExcludedProperty = require('../models/ExcludedProperty');
const User = require('../models/User');
const { fetchAllListings, fetchValueAddMultifamily, scoreListing, calculateMarketStats } = require('../services/homeDataService');

// Exclude 3BR/4BR single-family over $250k — multifamily has no cap
const SFR_PRICE_CAP = 250000;
const sfrPriceFilter = {
  [Op.or]: [
    { propertyType: 'multi_family' },
    { price: { [Op.lte]: SFR_PRICE_CAP } }
  ]
};

const getAllHomeListings = async (req, res) => {
  try {
    const { metro, beds, propertyType, minPrice, maxPrice, minScore, sort } = req.query;
    const where = { isActive: true, ...sfrPriceFilter };
    if (metro) where.metro = metro;
    if (beds) where.beds = parseInt(beds);
    if (propertyType) where.propertyType = propertyType;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (minScore) where.dealScore = { [Op.gte]: parseFloat(minScore) };

    let order = [['dealScore', 'DESC NULLS LAST']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    if (sort === 'price_desc') order = [['price', 'DESC']];
    if (sort === 'newest') order = [['createdAt', 'DESC']];
    if (sort === 'dom') order = [['daysOnMarket', 'DESC NULLS LAST']];

    const listings = await HomeListing.findAll({ where, order });
    res.json({ listings, count: listings.length });
  } catch (error) {
    console.error('Error fetching home listings:', error);
    res.status(500).json({ error: 'Failed to fetch home listings' });
  }
};

const getHomeAnalytics = async (req, res) => {
  try {
    const { metro } = req.query;
    const where = { isActive: true, ...sfrPriceFilter };
    if (metro) where.metro = metro;
    const listings = await HomeListing.findAll({ where, raw: true });

    const metroGroups = {};
    for (const l of listings) {
      if (!metroGroups[l.metro]) metroGroups[l.metro] = [];
      metroGroups[l.metro].push(l);
    }

    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const analytics = {};
    for (const [metroName, group] of Object.entries(metroGroups)) {
      const prices = group.map(l => parseFloat(l.price)).filter(v => v > 0);
      const pps = group.map(l => parseFloat(l.pricePerSqft)).filter(v => v > 0);
      const doms = group.map(l => parseInt(l.daysOnMarket)).filter(v => v > 0);
      const scores = group.map(l => parseFloat(l.dealScore)).filter(v => v > 0);

      const sfr = group.filter(l => l.propertyType !== 'multi_family');
      const multi = group.filter(l => l.propertyType === 'multi_family');

      const statsFor = (subset) => {
        const p = subset.map(l => parseFloat(l.price)).filter(v => v > 0);
        const pp = subset.map(l => parseFloat(l.pricePerSqft)).filter(v => v > 0);
        const d = subset.map(l => parseInt(l.daysOnMarket)).filter(v => v > 0);
        const s = subset.map(l => parseFloat(l.dealScore)).filter(v => v > 0);
        return {
          count: subset.length,
          avgPrice: avg(p),
          avgPricePerSqft: avg(pp),
          avgDOM: avg(d),
          avgDealScore: avg(s),
          beds3Count: subset.filter(l => l.beds === 3).length,
          beds4Count: subset.filter(l => l.beds === 4).length
        };
      };

      analytics[metroName] = {
        count: group.length,
        avgPrice: avg(prices),
        avgPricePerSqft: avg(pps),
        avgDOM: avg(doms),
        avgDealScore: avg(scores),
        medianPrice: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] || 0,
        beds3Count: group.filter(l => l.beds === 3).length,
        beds4Count: group.filter(l => l.beds === 4).length,
        multifamilyCount: group.filter(l => l.propertyType === 'multi_family').length,
        sfr: statsFor(sfr),
        multi: statsFor(multi)
      };
    }

    const allPrices = listings.map(l => parseFloat(l.price)).filter(v => v > 0);
    const allPPS = listings.map(l => parseFloat(l.pricePerSqft)).filter(v => v > 0);
    const allDOM = listings.map(l => parseInt(l.daysOnMarket)).filter(v => v > 0);
    const overall = {
      totalListings: listings.length,
      avgPrice: avg(allPrices),
      avgPricePerSqft: avg(allPPS),
      avgDOM: avg(allDOM)
    };
    res.json({ analytics, overall });
  } catch (error) {
    console.error('Error fetching home analytics:', error);
    res.status(500).json({ error: 'Failed to fetch home analytics' });
  }
};

const getTopDeals = async (req, res) => {
  try {
    const { metro, limit } = req.query;
    const where = { isActive: true, dealScore: { [Op.not]: null }, ...sfrPriceFilter };
    if (metro) where.metro = metro;
    const listings = await HomeListing.findAll({
      where, order: [['dealScore', 'DESC']], limit: parseInt(limit) || 50
    });
    res.json({ listings, count: listings.length });
  } catch (error) {
    console.error('Error fetching top deals:', error);
    res.status(500).json({ error: 'Failed to fetch top deals' });
  }
};

const getHomeListingById = async (req, res) => {
  try {
    const listing = await HomeListing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    const comparables = await HomeComparable.findAll({
      where: { homeListingId: listing.id }, order: [['soldDate', 'DESC']]
    });
    res.json({ listing, comparables });
  } catch (error) {
    console.error('Error fetching home listing:', error);
    res.status(500).json({ error: 'Failed to fetch home listing' });
  }
};

const REFRESH_COOLDOWN_DAYS = 10;

const getRefreshStatus = async (req, res) => {
  try {
    const latest = await HomeListing.findOne({
      where: { isActive: true },
      order: [['lastUpdated', 'DESC']],
      attributes: ['lastUpdated']
    });
    const lastRefresh = latest?.lastUpdated || null;
    let canRefresh = true;
    let daysUntilRefresh = 0;
    let daysSinceRefresh = null;

    if (lastRefresh) {
      const elapsed = (new Date() - new Date(lastRefresh)) / (1000 * 60 * 60 * 24);
      daysSinceRefresh = Math.floor(elapsed);
      if (elapsed < REFRESH_COOLDOWN_DAYS) {
        canRefresh = false;
        daysUntilRefresh = Math.ceil(REFRESH_COOLDOWN_DAYS - elapsed);
      }
    }

    const count = await HomeListing.count({ where: { isActive: true } });
    res.json({ lastRefresh, canRefresh, daysUntilRefresh, daysSinceRefresh, cooldownDays: REFRESH_COOLDOWN_DAYS, totalListings: count });
  } catch (error) {
    console.error('Error getting refresh status:', error);
    res.status(500).json({ error: 'Failed to get refresh status' });
  }
};

const refreshListings = async (req, res) => {
  try {
    // Enforce 10-day cooldown
    const latest = await HomeListing.findOne({
      where: { isActive: true },
      order: [['lastUpdated', 'DESC']],
      attributes: ['lastUpdated']
    });
    if (latest?.lastUpdated) {
      const elapsed = (new Date() - new Date(latest.lastUpdated)) / (1000 * 60 * 60 * 24);
      if (elapsed < REFRESH_COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(REFRESH_COOLDOWN_DAYS - elapsed);
        return res.status(429).json({
          error: `Refresh blocked — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} until next refresh allowed`,
          daysUntilRefresh: daysLeft,
          lastRefresh: latest.lastUpdated
        });
      }
    }

    console.log('Starting home listing refresh from RapidAPI...');
    const rawListings = await fetchAllListings();
    let created = 0, updated = 0, skipped = 0, errors = 0;
    for (const listing of rawListings) {
      if (!listing.sourceId || !listing.price) { skipped++; continue; }
      try {
        const [record, wasCreated] = await HomeListing.upsert(listing, { conflictFields: ['sourceId'] });
        if (wasCreated) created++; else updated++;
      } catch (err) {
        errors++;
        console.error(`Error upserting ${listing.address}: ${err.message}`);
      }
    }
    console.log(`Refresh complete: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
    res.json({ message: 'Refresh complete', stats: { total: rawListings.length, created, updated, skipped, errors } });
  } catch (error) {
    console.error('Error refreshing home listings:', error);
    res.status(500).json({ error: 'Failed to refresh listings' });
  }
};

const scoreListings = async (req, res) => {
  try {
    const listings = await HomeListing.findAll({ where: { isActive: true }, raw: true });
    const marketStats = calculateMarketStats(listings);
    let scored = 0;
    for (const listing of listings) {
      const { dealScore, scoreBreakdown } = scoreListing(listing, marketStats);
      await HomeListing.update({ dealScore, scoreBreakdown }, { where: { id: listing.id } });
      scored++;
    }
    res.json({ message: `Scored ${scored} listings`, marketStats });
  } catch (error) {
    console.error('Error scoring listings:', error);
    res.status(500).json({ error: 'Failed to score listings' });
  }
};

const getHomeListingsForMap = async (req, res) => {
  try {
    const { metro, beds, propertyType } = req.query;
    const where = { isActive: true, latitude: { [Op.not]: null }, longitude: { [Op.not]: null }, ...sfrPriceFilter };
    if (metro) where.metro = metro;
    if (beds) where.beds = parseInt(beds);
    if (propertyType) where.propertyType = propertyType;
    const listings = await HomeListing.findAll({
      where,
      attributes: ['id', 'address', 'city', 'metro', 'latitude', 'longitude', 'price', 'beds', 'baths', 'sqft', 'propertyType', 'dealScore', 'photoUrl', 'daysOnMarket']
    });
    res.json({ listings, count: listings.length });
  } catch (error) {
    console.error('Error fetching map listings:', error);
    res.status(500).json({ error: 'Failed to fetch map listings' });
  }
};

const getMarketHistory = async (req, res) => {
  try {
    const { metro, propertyType } = req.query;
    const where = {};
    if (metro) where.metro = metro;
    if (propertyType) where.propertyType = propertyType;
    const snapshots = await MarketSnapshot.findAll({
      where,
      order: [['period', 'ASC'], ['metro', 'ASC'], ['propertyType', 'ASC']]
    });
    res.json({ snapshots });
  } catch (error) {
    console.error('Error fetching market history:', error);
    res.status(500).json({ error: 'Failed to fetch market history' });
  }
};

const saveProperty = async (req, res) => {
  try {
    const { homeListingId } = req.body;
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const listing = await HomeListing.findByPk(homeListingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const savedBy = `Saved by ${user.firstName}`;
    const [saved, created] = await SavedProperty.findOrCreate({
      where: { userId, homeListingId },
      defaults: { savedBy }
    });

    res.json({ saved, created });
  } catch (error) {
    console.error('Error saving property:', error);
    res.status(500).json({ error: 'Failed to save property' });
  }
};

const unsaveProperty = async (req, res) => {
  try {
    const { homeListingId } = req.params;
    const userId = req.user.id;
    const deleted = await SavedProperty.destroy({ where: { userId, homeListingId } });
    res.json({ deleted: deleted > 0 });
  } catch (error) {
    console.error('Error unsaving property:', error);
    res.status(500).json({ error: 'Failed to unsave property' });
  }
};

const getSavedProperties = async (req, res) => {
  try {
    const saved = await SavedProperty.findAll({
      include: [{ model: HomeListing }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ saved });
  } catch (error) {
    console.error('Error fetching saved properties:', error);
    res.status(500).json({ error: 'Failed to fetch saved properties' });
  }
};

const getMySavedIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const saved = await SavedProperty.findAll({
      where: { userId },
      attributes: ['homeListingId']
    });
    res.json({ ids: saved.map(s => s.homeListingId) });
  } catch (error) {
    console.error('Error fetching saved IDs:', error);
    res.status(500).json({ error: 'Failed to fetch saved IDs' });
  }
};

const excludeProperty = async (req, res) => {
  try {
    const { homeListingId } = req.body;
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const listing = await HomeListing.findByPk(homeListingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const excludedBy = `Excluded by ${user.firstName}`;
    const [excluded, created] = await ExcludedProperty.findOrCreate({
      where: { userId, homeListingId },
      defaults: { excludedBy }
    });

    res.json({ excluded, created });
  } catch (error) {
    console.error('Error excluding property:', error);
    res.status(500).json({ error: 'Failed to exclude property' });
  }
};

const unexcludeProperty = async (req, res) => {
  try {
    const { homeListingId } = req.params;
    const userId = req.user.id;
    const deleted = await ExcludedProperty.destroy({ where: { userId, homeListingId } });
    res.json({ deleted: deleted > 0 });
  } catch (error) {
    console.error('Error unexcluding property:', error);
    res.status(500).json({ error: 'Failed to unexclude property' });
  }
};

const getExcludedProperties = async (req, res) => {
  try {
    const excluded = await ExcludedProperty.findAll({
      include: [{ model: HomeListing }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ excluded });
  } catch (error) {
    console.error('Error fetching excluded properties:', error);
    res.status(500).json({ error: 'Failed to fetch excluded properties' });
  }
};

const getMyExcludedIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const excluded = await ExcludedProperty.findAll({
      where: { userId },
      attributes: ['homeListingId']
    });
    res.json({ ids: excluded.map(e => e.homeListingId) });
  } catch (error) {
    console.error('Error fetching excluded IDs:', error);
    res.status(500).json({ error: 'Failed to fetch excluded IDs' });
  }
};

// Value Add Multifamily - get cached listings from DB
const getValueAddListings = async (req, res) => {
  try {
    const { metro, sort } = req.query;
    const where = {
      isActive: true,
      propertyType: 'multi_family',
      price: { [Op.gte]: 3000000, [Op.lte]: 6000000 }
    };
    if (metro && metro !== 'all') where.metro = metro;

    let order = [['price', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    if (sort === 'price_desc') order = [['price', 'DESC']];
    if (sort === 'newest') order = [['createdAt', 'DESC']];
    if (sort === 'dom') order = [['daysOnMarket', 'DESC NULLS LAST']];

    const listings = await HomeListing.findAll({ where, order });

    // Add isValueAdd flag based on description
    const enhanced = listings.map(l => {
      const desc = (l.description || '').toLowerCase();
      const isValueAdd = desc.includes('value add') || desc.includes('value-add') || desc.includes('valueadd');
      return { ...l.toJSON(), isValueAdd };
    });

    res.json({ listings: enhanced, count: enhanced.length });
  } catch (error) {
    console.error('Error fetching Value Add listings:', error);
    res.status(500).json({ error: 'Failed to fetch Value Add listings' });
  }
};

// Refresh Value Add Multifamily from API
const refreshValueAddListings = async (req, res) => {
  try {
    console.log('Starting Value Add multifamily refresh from RapidAPI...');
    const rawListings = await fetchValueAddMultifamily();
    let created = 0, updated = 0, skipped = 0, errors = 0;

    for (const listing of rawListings) {
      if (!listing.sourceId || !listing.price) { skipped++; continue; }
      try {
        const [record, wasCreated] = await HomeListing.upsert(listing, { conflictFields: ['sourceId'] });
        if (wasCreated) created++; else updated++;
      } catch (err) {
        errors++;
        console.error(`Error upserting ${listing.address}: ${err.message}`);
      }
    }

    console.log(`Value Add refresh complete: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);
    res.json({ message: 'Value Add refresh complete', stats: { total: rawListings.length, created, updated, skipped, errors } });
  } catch (error) {
    console.error('Error refreshing Value Add listings:', error);
    res.status(500).json({ error: 'Failed to refresh Value Add listings' });
  }
};

module.exports = {
  getAllHomeListings, getHomeAnalytics, getTopDeals,
  getHomeListingById, refreshListings, scoreListings, getHomeListingsForMap, getRefreshStatus,
  getMarketHistory, saveProperty, unsaveProperty, getSavedProperties, getMySavedIds,
  excludeProperty, unexcludeProperty, getExcludedProperties, getMyExcludedIds,
  getValueAddListings, refreshValueAddListings
};
