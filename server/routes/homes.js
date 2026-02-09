const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllHomeListings, getHomeAnalytics, getTopDeals,
  getHomeListingById, refreshListings, scoreListings, getHomeListingsForMap, getRefreshStatus,
  getMarketHistory, saveProperty, unsaveProperty, getSavedProperties, getMySavedIds,
  excludeProperty, unexcludeProperty, getExcludedProperties, getMyExcludedIds,
  getValueAddListings, refreshValueAddListings
} = require('../controllers/homeListingController');

router.use(auth);

router.get('/', getAllHomeListings);
router.get('/analytics', getHomeAnalytics);
router.get('/top-deals', getTopDeals);
router.get('/map', getHomeListingsForMap);
router.get('/refresh-status', getRefreshStatus);
router.get('/history', getMarketHistory);
router.get('/saved', getSavedProperties);
router.get('/saved/my-ids', getMySavedIds);
router.post('/save', saveProperty);
router.delete('/save/:homeListingId', unsaveProperty);
router.get('/excluded', getExcludedProperties);
router.get('/excluded/my-ids', getMyExcludedIds);
router.post('/exclude', excludeProperty);
router.delete('/exclude/:homeListingId', unexcludeProperty);
router.post('/refresh', refreshListings);
router.post('/score', scoreListings);
router.get('/value-add', getValueAddListings);
router.post('/value-add/refresh', refreshValueAddListings);
router.get('/:id', getHomeListingById);

module.exports = router;
