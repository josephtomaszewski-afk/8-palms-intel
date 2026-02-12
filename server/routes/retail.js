const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
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
} = require('../controllers/retailController');

// Debug/test endpoint (no auth for easier testing)
router.get('/test-api', testLoopNetApi);

// All other routes require authentication
router.use(auth);

// Chat endpoint - natural language search
router.post('/chat', chat);

// Saved searches CRUD
router.get('/searches', getSavedSearches);
router.post('/searches', saveSearch);
router.put('/searches/:id', updateSearch);
router.delete('/searches/:id', deleteSearch);
router.get('/searches/:id/results', getSearchResults);
router.post('/searches/:id/run', runSearch);

// Listings
router.get('/listings', getListings);
router.get('/listings/:id', getListingById);
router.post('/listings/refresh', refreshListings);

// User preferences
router.put('/preferences', updateUserPreferences);

module.exports = router;
