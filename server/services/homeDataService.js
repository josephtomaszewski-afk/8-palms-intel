const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'us-real-estate-listings.p.rapidapi.com';

const METROS = {
  Tampa: {
    cities: ['Tampa', 'St Petersburg', 'Clearwater', 'Brandon', 'Riverview', 'Wesley Chapel', 'Lakeland', 'Plant City', 'Valrico', 'Lutz'],
    state: 'FL'
  },
  Orlando: {
    cities: ['Orlando', 'Kissimmee', 'Sanford', 'Winter Park', 'Altamonte Springs', 'Ocoee', 'Apopka', 'Clermont', 'Winter Garden', 'Lake Mary'],
    state: 'FL'
  },
  Jacksonville: {
    cities: ['Jacksonville', 'Orange Park', 'Fleming Island', 'Jacksonville Beach', 'Neptune Beach', 'Atlantic Beach', 'Fernandina Beach', 'St Augustine', 'Ponte Vedra Beach', 'Middleburg'],
    state: 'FL'
  }
};

const SEARCH_CONFIGS = [
  { beds_min: 3, beds_max: 3, property_type: 'single_family' },
  { beds_min: 4, beds_max: 4, property_type: 'single_family' },
  { property_type: 'multi_family' }
];

const apiClient = axios.create({
  baseURL: 'https://us-real-estate-listings.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
  }
});

async function fetchListings(city, state, searchConfig) {
  try {
    const params = {
      location: `${city}, ${state}`,
      status: 'for_sale',
      sort: 'newest',
      limit: 200
    };
    if (searchConfig.beds_min) params.beds_min = searchConfig.beds_min;
    if (searchConfig.beds_max) params.beds_max = searchConfig.beds_max;
    if (searchConfig.property_type) params.property_type = searchConfig.property_type;

    const response = await apiClient.get('/for-sale', { params });
    const data = response.data;
    if (data && Array.isArray(data.listings)) return data.listings;
    if (Array.isArray(data)) return data;
    console.log(`Unexpected response shape for ${city}:`, Object.keys(data || {}));
    return [];
  } catch (error) {
    console.error(`Error fetching listings for ${city}, ${state}:`, error.message);
    return [];
  }
}

function normalizeListing(raw, metro) {
  const desc = raw.description || {};
  const loc = raw.location || {};
  const addr = loc.address || {};
  const coord = addr.coordinate || {};

  const price = parseFloat(raw.list_price || 0);
  const sqft = parseInt(desc.sqft || 0);
  const pricePerSqft = price && sqft ? (price / sqft) : null;
  const beds = parseInt(desc.beds || 0);
  const baths = parseFloat(desc.baths || 0);

  let propertyType = 'single_family';
  const rawType = (desc.type || desc.sub_type || '').toLowerCase();
  if (rawType.includes('multi') || rawType.includes('duplex') || rawType.includes('triplex') || rawType.includes('quadplex')) {
    propertyType = 'multi_family';
  } else if (rawType.includes('mobile') || rawType.includes('land') || rawType.includes('lot')) {
    return null;
  }

  if (propertyType === 'single_family' && beds !== 3 && beds !== 4) return null;
  if (price <= 0) return null;

  const rentEstimates = {
    Tampa: { 3: 2100, 4: 2500, multi: 3200 },
    Orlando: { 3: 2200, 4: 2600, multi: 3400 },
    Jacksonville: { 3: 1900, 4: 2300, multi: 2900 }
  };
  const rentKey = propertyType === 'multi_family' ? 'multi' : beds;
  const estimatedRent = rentEstimates[metro]?.[rentKey] || 2200;
  const rentalYield = price > 0 ? ((estimatedRent * 12) / price) * 100 : null;

  const priceReductionAmount = raw.price_reduced_amount ? Math.abs(parseFloat(raw.price_reduced_amount)) : null;
  const priceReductions = priceReductionAmount ? 1 : 0;

  let daysOnMarket = null;
  if (raw.list_date) {
    daysOnMarket = Math.floor((new Date() - new Date(raw.list_date)) / (1000 * 60 * 60 * 24));
  }

  const addressLine = addr.line || `${addr.street_number || ''} ${addr.street_name || ''} ${addr.street_suffix || ''}`.trim();

  return {
    address: addressLine,
    city: addr.city || '',
    state: addr.state_code || 'FL',
    zipCode: addr.postal_code || null,
    latitude: parseFloat(coord.lat) || null,
    longitude: parseFloat(coord.lon) || null,
    propertyType,
    beds,
    baths,
    sqft,
    lotSize: parseInt(desc.lot_sqft || 0) || null,
    yearBuilt: parseInt(desc.year_built || 0) || null,
    stories: parseInt(desc.stories || 0) || null,
    garage: raw.flags?.is_garage_present ? 1 : null,
    price,
    originalPrice: priceReductionAmount ? price + priceReductionAmount : price,
    pricePerSqft,
    estimatedRent,
    rentalYield,
    daysOnMarket,
    priceReductions,
    priceReductionAmount,
    metro,
    neighborhood: loc.neighborhoods?.[0]?.name || null,
    source: 'realtor',
    sourceUrl: raw.href || null,
    sourceId: raw.property_id || raw.listing_id || null,
    photoUrl: raw.primary_photo?.href || raw.photos?.[0]?.href || null,
    listingStatus: raw.status || 'for_sale',
    isActive: true,
    lastUpdated: new Date()
  };
}

async function fetchAllListings() {
  const allListings = [];

  for (const [metroName, metroConfig] of Object.entries(METROS)) {
    for (const searchConfig of SEARCH_CONFIGS) {
      const citiesToSearch = metroConfig.cities.slice(0, 3);
      for (const city of citiesToSearch) {
        console.log(`Fetching ${searchConfig.property_type} (beds: ${searchConfig.beds_min || 'any'}) in ${city}, ${metroConfig.state}...`);
        const rawListings = await fetchListings(city, metroConfig.state, searchConfig);
        console.log(`  Got ${rawListings.length} raw listings`);
        const normalized = rawListings.map(raw => normalizeListing(raw, metroName)).filter(l => l !== null);
        console.log(`  ${normalized.length} after filtering`);
        allListings.push(...normalized);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log(`Fetched ${allListings.length} total listings across all metros`);
  return allListings;
}

function scoreListing(listing, marketStats) {
  const breakdown = {};
  const metro = listing.metro;
  const stats = marketStats[metro] || {};

  const avgPricePerSqft = stats.avgPricePerSqft || 250;
  const listingPPS = parseFloat(listing.pricePerSqft) || avgPricePerSqft;
  const priceRatio = listingPPS / avgPricePerSqft;
  breakdown.priceVsMarket = Math.max(0, Math.min(100, (1.3 - priceRatio) / 0.6 * 100));

  const dom = parseInt(listing.daysOnMarket) || 0;
  breakdown.daysOnMarket = Math.min(100, (dom / 90) * 100);

  const origPrice = parseFloat(listing.originalPrice) || parseFloat(listing.price);
  const currentPrice = parseFloat(listing.price);
  const reductionPct = origPrice > 0 ? ((origPrice - currentPrice) / origPrice) * 100 : 0;
  breakdown.priceReductions = Math.min(100, (reductionPct / 15) * 100);

  const yield_ = parseFloat(listing.rentalYield) || 0;
  breakdown.rentalYield = Math.max(0, Math.min(100, ((yield_ - 3) / 7) * 100));

  const yearBuilt = parseInt(listing.yearBuilt) || 1990;
  const age = new Date().getFullYear() - yearBuilt;
  breakdown.propertyAge = Math.max(0, Math.min(100, ((40 - age) / 35) * 100));

  const dealScore =
    breakdown.priceVsMarket * 0.30 +
    breakdown.daysOnMarket * 0.20 +
    breakdown.priceReductions * 0.20 +
    breakdown.rentalYield * 0.20 +
    breakdown.propertyAge * 0.10;

  return {
    dealScore: Math.round(dealScore * 100) / 100,
    scoreBreakdown: breakdown
  };
}

function calculateMarketStats(listings) {
  const stats = {};
  for (const metro of Object.keys(METROS)) {
    const metroListings = listings.filter(l => l.metro === metro);
    if (metroListings.length === 0) continue;
    const prices = metroListings.map(l => parseFloat(l.pricePerSqft)).filter(v => v > 0);
    const doms = metroListings.map(l => parseInt(l.daysOnMarket)).filter(v => v > 0);
    stats[metro] = {
      avgPricePerSqft: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 250,
      avgDOM: doms.length ? doms.reduce((a, b) => a + b, 0) / doms.length : 30,
      count: metroListings.length
    };
  }
  return stats;
}

module.exports = { fetchAllListings, scoreListing, calculateMarketStats, METROS, SEARCH_CONFIGS };
