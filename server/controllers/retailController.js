const { Op } = require('sequelize');
const { RetailListing, RetailSearch, RetailSearchResult, User } = require('../models');
const { parseSearchQuery, generateResultsResponse } = require('../services/claudeService');
const { fetchRetailByState, fetchRetailByStateBoth, fetchRetailByCity, searchRetailListings } = require('../services/retailDataService');

// Chat endpoint - process natural language query
const chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Parse the query using Claude
    const { success, criteria, response, error } = await parseSearchQuery(message);

    // Search for matching listings
    const listings = await searchRetailListings(criteria);

    // Generate response message
    const aiResponse = await generateResultsResponse(criteria, listings.length);

    res.json({
      success: true,
      message: aiResponse,
      criteria: criteria,
      listings: listings,
      suggestedSearch: {
        query: message,
        parsedCriteria: criteria
      },
      parseSuccess: success,
      parseError: error || null
    });
  } catch (error) {
    console.error('Error in retail chat:', error);
    res.status(500).json({ error: 'Failed to process search query' });
  }
};

// Get all saved searches for the authenticated user
const getSavedSearches = async (req, res) => {
  try {
    const userId = req.user.id;

    const searches = await RetailSearch.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ searches });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    res.status(500).json({ error: 'Failed to fetch saved searches' });
  }
};

// Save a new search
const saveSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, query, parsedCriteria, notifyEmail, notifySms } = req.body;

    if (!name || !query || !parsedCriteria) {
      return res.status(400).json({ error: 'Name, query, and parsedCriteria are required' });
    }

    const search = await RetailSearch.create({
      userId,
      name,
      query,
      parsedCriteria,
      notifyEmail: notifyEmail !== false,
      notifySms: notifySms === true,
      isActive: true
    });

    // Run the search and save initial results
    const listings = await searchRetailListings(parsedCriteria);
    for (const listing of listings) {
      await RetailSearchResult.findOrCreate({
        where: {
          retailSearchId: search.id,
          retailListingId: listing.id
        },
        defaults: {
          matchedAt: new Date(),
          isNew: false // Initial results are not "new"
        }
      });
    }

    // Update match count
    await search.update({ matchCount: listings.length });

    res.json({ search, matchCount: listings.length });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
};

// Update a saved search
const updateSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, notifyEmail, notifySms, isActive } = req.body;

    const search = await RetailSearch.findOne({
      where: { id, userId }
    });

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (notifyEmail !== undefined) updates.notifyEmail = notifyEmail;
    if (notifySms !== undefined) updates.notifySms = notifySms;
    if (isActive !== undefined) updates.isActive = isActive;

    await search.update(updates);

    res.json({ search });
  } catch (error) {
    console.error('Error updating search:', error);
    res.status(500).json({ error: 'Failed to update search' });
  }
};

// Delete a saved search
const deleteSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const search = await RetailSearch.findOne({
      where: { id, userId }
    });

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Delete associated results first
    await RetailSearchResult.destroy({
      where: { retailSearchId: id }
    });

    await search.destroy();

    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting search:', error);
    res.status(500).json({ error: 'Failed to delete search' });
  }
};

// Get results for a specific saved search
const getSearchResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const search = await RetailSearch.findOne({
      where: { id, userId }
    });

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const results = await RetailSearchResult.findAll({
      where: { retailSearchId: id },
      include: [{ model: RetailListing }],
      order: [['matchedAt', 'DESC']]
    });

    // Mark results as viewed
    await RetailSearchResult.update(
      { isViewed: true },
      { where: { retailSearchId: id, isViewed: false } }
    );

    res.json({
      search,
      results: results.map(r => ({
        ...r.RetailListing.toJSON(),
        matchedAt: r.matchedAt,
        isNew: r.isNew
      }))
    });
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
};

// Run a saved search manually
const runSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const search = await RetailSearch.findOne({
      where: { id, userId }
    });

    if (!search) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Run the search
    const listings = await searchRetailListings(search.parsedCriteria);

    // Check for new matches
    let newCount = 0;
    for (const listing of listings) {
      const [result, created] = await RetailSearchResult.findOrCreate({
        where: {
          retailSearchId: search.id,
          retailListingId: listing.id
        },
        defaults: {
          matchedAt: new Date(),
          isNew: true
        }
      });
      if (created) newCount++;
    }

    // Update search metadata
    await search.update({
      lastRunAt: new Date(),
      matchCount: listings.length
    });

    res.json({
      search,
      totalMatches: listings.length,
      newMatches: newCount,
      listings
    });
  } catch (error) {
    console.error('Error running search:', error);
    res.status(500).json({ error: 'Failed to run search' });
  }
};

// Refresh retail listings - currently uses sample data
// TODO: Replace with full LoopNet API when available or use web scraping
const refreshListings = async (req, res) => {
  try {
    const { state } = req.body;
    const targetState = state || 'FL';

    console.log(`Refreshing retail listings for ${targetState}...`);

    // Check current listings count
    const existingCount = await RetailListing.count({ where: { isActive: true } });

    if (existingCount === 0) {
      // Run the seed script to populate with sample data
      const { execSync } = require('child_process');
      const path = require('path');
      const scriptPath = path.join(__dirname, '..', 'scripts', 'seedRetailListings.js');

      try {
        execSync(`node ${scriptPath}`, { cwd: path.join(__dirname, '..') });
        const newCount = await RetailListing.count({ where: { isActive: true } });

        res.json({
          message: 'Sample retail listings loaded',
          stats: {
            total: newCount,
            created: newCount,
            updated: 0,
            skipped: 0,
            errors: 0
          },
          note: 'Using sample Florida retail data. Full LoopNet integration coming soon.'
        });
      } catch (seedError) {
        console.error('Seed error:', seedError);
        res.status(500).json({ error: 'Failed to load sample listings' });
      }
    } else {
      // Already have data, just return the count
      res.json({
        message: 'Retail listings already loaded',
        stats: {
          total: existingCount,
          created: 0,
          updated: existingCount,
          skipped: 0,
          errors: 0
        },
        note: 'Database already contains retail listings. Search away!'
      });
    }
  } catch (error) {
    console.error('Error refreshing retail listings:', error);
    res.status(500).json({ error: 'Failed to refresh retail listings' });
  }
};

// Get all retail listings (with filters)
const getListings = async (req, res) => {
  try {
    const { state, city, priceMin, priceMax, keyword, sort } = req.query;

    const where = { isActive: true };

    if (state) where.state = state;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price[Op.gte] = parseFloat(priceMin);
      if (priceMax) where.price[Op.lte] = parseFloat(priceMax);
    }
    if (keyword) {
      where[Op.or] = [
        { keywords: { [Op.contains]: [keyword.toLowerCase()] } },
        { description: { [Op.iLike]: `%${keyword}%` } }
      ];
    }

    let order = [['price', 'ASC']];
    if (sort === 'price_desc') order = [['price', 'DESC']];
    if (sort === 'newest') order = [['createdAt', 'DESC']];
    if (sort === 'dom_desc') order = [['daysOnMarket', 'DESC NULLS LAST']];

    const listings = await RetailListing.findAll({
      where,
      order,
      limit: 200
    });

    res.json({ listings, count: listings.length });
  } catch (error) {
    console.error('Error fetching retail listings:', error);
    res.status(500).json({ error: 'Failed to fetch retail listings' });
  }
};

// Get single retail listing by ID
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await RetailListing.findByPk(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ listing });
  } catch (error) {
    console.error('Error fetching retail listing:', error);
    res.status(500).json({ error: 'Failed to fetch retail listing' });
  }
};

// Update user notification preferences
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, notificationEmail, notificationSms } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (notificationEmail !== undefined) updates.notificationEmail = notificationEmail;
    if (notificationSms !== undefined) updates.notificationSms = notificationSms;

    await user.update(updates);

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        notificationEmail: user.notificationEmail,
        notificationSms: user.notificationSms
      }
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Debug endpoint to test LoopNet API directly
const testLoopNetApi = async (req, res) => {
  const axios = require('axios');

  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  console.log('Testing LoopNet API...');

  const testResults = {
    apiKeyPresent: !!RAPIDAPI_KEY,
    tests: []
  };

  const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': 'loopnet-api.p.rapidapi.com',
    'Content-Type': 'application/json'
  };

  // Test: Get full response from Sale by State
  try {
    const response = await axios.post('https://loopnet-api.p.rapidapi.com/loopnet/sale/searchByState',
      { state: 'FL', page: 1 },
      { headers }
    );

    const rawData = response.data?.data || [];
    testResults.tests.push({
      name: 'Sale by State - Full Sample',
      status: 'success',
      listingsCount: rawData.length,
      firstListing: rawData[0],
      secondListing: rawData[1],
      thirdListing: rawData[2]
    });

  } catch (error) {
    testResults.tests.push({
      name: 'Sale by State',
      status: 'error',
      error: error.message
    });
  }

  res.json(testResults);
};

module.exports = {
  chat,
  getSavedSearches,
  saveSearch,
  updateSearch,
  deleteSearch,
  getSearchResults,
  runSearch,
  refreshListings,
  getListings,
  getListingById,
  updateUserPreferences,
  testLoopNetApi
};
