const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const LOOPNET_HOST = 'loopnet-api.p.rapidapi.com';

const loopnetClient = axios.create({
  baseURL: 'https://loopnet-api.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': LOOPNET_HOST,
    'Content-Type': 'application/json'
  }
});

// Keywords to extract from listing descriptions
const RETAIL_KEYWORDS = [
  // Restaurant-specific
  'restaurant', 'grease trap', 'hood system', 'kitchen', 'drive-thru', 'drive thru',
  'liquor license', 'beer wine', 'full bar', 'outdoor seating', 'patio', 'cafe',
  'fast food', 'qsr', 'quick service', 'dine-in', 'takeout', 'delivery',

  // Retail types
  'strip mall', 'shopping center', 'retail plaza', 'storefront', 'freestanding',
  'pad site', 'end cap', 'anchor', 'inline', 'outparcel', 'stand alone',

  // Lease/Financial terms
  'nnn', 'triple net', 'ground lease', 'sale leaseback', 'absolute net',
  'gross lease', 'modified gross',

  // Features
  'high traffic', 'corner lot', 'signage', 'parking', 'signalized intersection',
  'frontage', 'visibility', 'ingress egress', 'loading dock'
];

// Extract matching keywords from description text
function extractKeywords(description) {
  if (!description) return [];
  const descLower = description.toLowerCase();
  return RETAIL_KEYWORDS.filter(keyword => descLower.includes(keyword.toLowerCase()));
}

// Determine property subtype from description and type
function determineSubtype(description, rawType) {
  const desc = (description || '').toLowerCase();
  const type = (rawType || '').toLowerCase();

  if (desc.includes('restaurant') || desc.includes('kitchen') || desc.includes('grease trap')) {
    return 'restaurant';
  }
  if (desc.includes('strip') || desc.includes('plaza') || desc.includes('shopping center')) {
    return 'strip_mall';
  }
  if (desc.includes('freestanding') || desc.includes('stand alone') || desc.includes('pad site')) {
    return 'freestanding';
  }
  if (desc.includes('end cap')) {
    return 'end_cap';
  }
  if (desc.includes('inline')) {
    return 'inline';
  }
  if (type.includes('retail')) {
    return 'retail';
  }
  return 'retail';
}

// Fetch retail listings by state (for sale or lease)
// Note: This API only returns listingId + coordinates, not full details
async function fetchRetailByState(state, listingType = 'sale', priceMin = null, priceMax = null) {
  const allListings = [];

  // Determine endpoint based on listing type
  const endpoint = listingType === 'lease'
    ? '/loopnet/lease/searchByState'
    : '/loopnet/sale/searchByState';

  try {
    console.log(`Fetching LoopNet retail listings for ${state} (${listingType})...`);

    // Fetch multiple pages
    for (let page = 1; page <= 3; page++) {
      const requestBody = { state: state, page: page };

      try {
        const response = await loopnetClient.post(endpoint, requestBody);
        const rawData = response.data?.data || [];

        console.log(`  Page ${page}: Got ${rawData.length} listings`);

        for (const raw of rawData) {
          const normalized = normalizeLoopNetListing(raw, listingType, state);
          if (normalized) allListings.push(normalized);
        }

        if (rawData.length < 100) break; // No more pages

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (pageError) {
        console.error(`  Error fetching page ${page}:`, pageError.message);
        break;
      }
    }

  } catch (error) {
    console.error(`Error fetching retail listings for ${state}:`, error.message);
  }

  console.log(`Fetched ${allListings.length} retail listings for ${state} (${listingType})`);
  return allListings;
}

// Normalize listing from the limited LoopNet API response
// The API only provides listingId and coordinates, so we construct what we can
function normalizeLoopNetListing(raw, listingType, requestedState) {
  if (!raw.listingId) return null;

  const coords = raw.coordinations?.[0] || [];
  const lng = coords[0] || null;
  const lat = coords[1] || null;

  // The LoopNet URL pattern for listings
  const sourceUrl = `https://www.loopnet.com/Listing/${raw.listingId}/`;

  return {
    address: `LoopNet Listing #${raw.listingId}`,
    city: 'View on LoopNet',
    state: requestedState || 'FL',
    zipCode: null,
    latitude: lat,
    longitude: lng,
    propertyType: 'retail',
    propertySubtype: 'retail',
    sqft: null,
    lotSize: null,
    yearBuilt: null,
    price: 0, // Unknown - user must click through
    pricePerSqft: null,
    capRate: null,
    noi: null,
    daysOnMarket: null,
    description: `View full details on LoopNet. Listing ID: ${raw.listingId}`,
    keywords: [],
    tenantInfo: null,
    leaseType: null,
    occupancy: null,
    source: 'loopnet',
    sourceId: `loopnet-${raw.listingId}`,
    sourceUrl: sourceUrl,
    photoUrl: null,
    listingStatus: listingType === 'lease' ? 'for_lease' : 'for_sale',
    isActive: true,
    lastUpdated: new Date()
  };
}

// Major Florida cities for city-based search fallback
const FLORIDA_CITIES = [
  'Miami', 'Fort Lauderdale', 'West Palm Beach', 'Orlando', 'Tampa',
  'Jacksonville', 'St. Petersburg', 'Clearwater', 'Naples', 'Fort Myers',
  'Sarasota', 'Boca Raton', 'Pompano Beach', 'Hollywood', 'Hialeah',
  'Coral Gables', 'Doral', 'Aventura', 'Pembroke Pines', 'Davie'
];

// Fetch both sale and lease listings
async function fetchRetailByStateBoth(state, priceMin = null, priceMax = null) {
  console.log(`Fetching both sale and lease listings for ${state}...`);

  // First try state-based search
  const [saleListings, leaseListings] = await Promise.all([
    fetchRetailByState(state, 'sale', priceMin, priceMax),
    fetchRetailByState(state, 'lease', priceMin, priceMax)
  ]);

  let combined = [...saleListings, ...leaseListings];
  console.log(`State-based search: ${combined.length} (${saleListings.length} sale, ${leaseListings.length} lease)`);

  // If state-based returned nothing, fall back to city-based searches
  if (combined.length === 0 && state === 'FL') {
    console.log('State search returned 0 results. Trying city-based search fallback...');
    combined = await fetchRetailFromCities(FLORIDA_CITIES.slice(0, 10), state);
  }

  return combined;
}

// Fetch retail from multiple cities
async function fetchRetailFromCities(cities, state) {
  const allListings = [];
  const seenIds = new Set();

  for (const city of cities) {
    console.log(`  Trying city: ${city}...`);

    // Try both sale and lease endpoints
    for (const listingType of ['sale', 'lease']) {
      try {
        const endpoint = listingType === 'lease'
          ? '/loopnet/lease/searchByCity'
          : '/loopnet/sale/searchByCity';

        const requestBody = {
          city: city,
          state: state,
          page: 1
        };

        console.log(`    ${listingType} endpoint: ${endpoint}, body:`, JSON.stringify(requestBody));

        const response = await loopnetClient.post(endpoint, requestBody);
        const data = response.data;

        console.log(`    Response type: ${typeof data}`);
        if (data) {
          console.log(`    Response keys: ${Object.keys(data)}`);
          console.log(`    Response sample: ${JSON.stringify(data).substring(0, 300)}`);
        }

        let rawListings = [];
        if (data && Array.isArray(data.results)) rawListings = data.results;
        else if (data && Array.isArray(data.listings)) rawListings = data.listings;
        else if (data && Array.isArray(data.properties)) rawListings = data.properties;
        else if (data && Array.isArray(data.data)) rawListings = data.data;
        else if (Array.isArray(data)) rawListings = data;

        console.log(`    Got ${rawListings.length} raw listings for ${city} (${listingType})`);

        for (const raw of rawListings) {
          const normalized = normalizeRetailListing(raw, listingType);
          if (normalized && !seenIds.has(normalized.sourceId)) {
            seenIds.add(normalized.sourceId);
            allListings.push(normalized);
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`    Error fetching ${listingType} for ${city}:`, error.message);
        if (error.response) {
          console.error(`    Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        }
      }
    }
  }

  console.log(`City-based search found ${allListings.length} total listings`);
  return allListings;
}

// Fetch retail listings by city
async function fetchRetailByCity(city, state, priceMin = null, priceMax = null) {
  const allListings = [];

  try {
    console.log(`Fetching LoopNet retail listings for ${city}, ${state}...`);

    const requestBody = {
      city: city,
      state: state,
      propertyType: 'Retail',
      page: 1
    };
    if (priceMin) requestBody.priceMin = priceMin;
    if (priceMax) requestBody.priceMax = priceMax;

    const response = await loopnetClient.post('/loopnet/sale/searchByCity', requestBody);
    const data = response.data;

    let rawListings = [];
    if (data && Array.isArray(data.results)) rawListings = data.results;
    else if (data && Array.isArray(data.listings)) rawListings = data.listings;
    else if (data && Array.isArray(data.properties)) rawListings = data.properties;
    else if (Array.isArray(data)) rawListings = data;

    console.log(`  Got ${rawListings.length} raw listings`);

    for (const raw of rawListings) {
      const normalized = normalizeRetailListing(raw);
      if (normalized) allListings.push(normalized);
    }

  } catch (error) {
    console.error(`Error fetching retail for ${city}, ${state}:`, error.message);
  }

  return allListings;
}

// Normalize LoopNet listing to RetailListing schema
function normalizeRetailListing(raw, listingType = 'sale') {
  try {
    // For lease listings, price might be monthly rent
    const price = parseFloat(raw.price || raw.askingPrice || raw.listPrice || raw.rent || raw.monthlyRent || 0);
    if (price <= 0) return null;

    const address = raw.address || raw.streetAddress || raw.location?.address || '';
    const city = raw.city || raw.location?.city || '';
    const state = raw.state || raw.location?.state || '';
    const zipCode = raw.zip || raw.zipCode || raw.postalCode || raw.location?.zip || null;

    if (!address || address.length < 5) return null;

    const sqft = parseInt(raw.buildingSize || raw.sqft || raw.squareFeet || raw.size || 0);
    const pricePerSqft = price && sqft ? (price / sqft) : null;
    const description = raw.description || raw.remarks || raw.comments || '';

    // Extract keywords from description
    const keywords = extractKeywords(description);
    const propertySubtype = determineSubtype(description, raw.propertyType || raw.type);

    // Parse coordinates
    const lat = parseFloat(raw.latitude || raw.lat || raw.location?.lat || raw.geo?.lat || 0);
    const lon = parseFloat(raw.longitude || raw.lng || raw.lon || raw.location?.lng || raw.geo?.lng || 0);

    // Days on market
    let daysOnMarket = null;
    if (raw.listDate || raw.dateAdded || raw.listedDate) {
      const listDate = new Date(raw.listDate || raw.dateAdded || raw.listedDate);
      daysOnMarket = Math.floor((new Date() - listDate) / (1000 * 60 * 60 * 24));
    } else if (raw.daysOnMarket || raw.dom) {
      daysOnMarket = parseInt(raw.daysOnMarket || raw.dom);
    }

    // Generate unique source ID
    const sourceId = raw.id || raw.listingId || raw.propertyId || `loopnet-retail-${address.replace(/\s/g, '')}-${zipCode}`;

    // Determine lease type from description
    let leaseType = null;
    const descLower = description.toLowerCase();
    if (descLower.includes('nnn') || descLower.includes('triple net')) {
      leaseType = 'NNN';
    } else if (descLower.includes('absolute net')) {
      leaseType = 'Absolute Net';
    } else if (descLower.includes('modified gross')) {
      leaseType = 'Modified Gross';
    } else if (descLower.includes('gross lease')) {
      leaseType = 'Gross';
    }

    // Occupancy status
    let occupancy = null;
    if (descLower.includes('vacant')) {
      occupancy = 'vacant';
    } else if (descLower.includes('occupied') || descLower.includes('tenant')) {
      occupancy = 'occupied';
    }

    return {
      address: address,
      city: city,
      state: state,
      zipCode: zipCode,
      latitude: lat || null,
      longitude: lon || null,
      propertyType: 'retail',
      propertySubtype: propertySubtype,
      sqft: sqft || null,
      lotSize: parseInt(raw.lotSize || raw.landArea || 0) || null,
      yearBuilt: parseInt(raw.yearBuilt || raw.built || 0) || null,
      price: price,
      pricePerSqft: pricePerSqft,
      capRate: raw.capRate ? parseFloat(raw.capRate) : null,
      noi: raw.noi ? parseFloat(raw.noi) : null,
      daysOnMarket: daysOnMarket,
      description: description,
      keywords: keywords,
      tenantInfo: raw.tenant || raw.tenantInfo || null,
      leaseType: leaseType,
      occupancy: occupancy,
      source: 'loopnet',
      sourceId: sourceId,
      sourceUrl: raw.url || raw.detailUrl || raw.link || null,
      photoUrl: raw.image || raw.photo || raw.primaryImage || raw.photos?.[0] || null,
      listingStatus: listingType === 'lease' ? 'for_lease' : 'for_sale',
      isActive: true,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error normalizing retail listing:', error.message);
    return null;
  }
}

// Search retail listings based on parsed criteria
async function searchRetailListings(criteria) {
  const { RetailListing } = require('../models');
  const { Op } = require('sequelize');

  const where = { isActive: true };

  // State filter
  if (criteria.state) {
    where.state = criteria.state;
  }

  // City filter (can be array)
  if (criteria.cities && criteria.cities.length > 0) {
    where.city = {
      [Op.or]: criteria.cities.map(c => ({
        [Op.iLike]: `%${c}%`
      }))
    };
  }

  // Price range
  if (criteria.priceMin || criteria.priceMax) {
    where.price = {};
    if (criteria.priceMin) where.price[Op.gte] = criteria.priceMin;
    if (criteria.priceMax) where.price[Op.lte] = criteria.priceMax;
  }

  // Sqft range
  if (criteria.sqftMin || criteria.sqftMax) {
    where.sqft = {};
    if (criteria.sqftMin) where.sqft[Op.gte] = criteria.sqftMin;
    if (criteria.sqftMax) where.sqft[Op.lte] = criteria.sqftMax;
  }

  // Property subtype
  if (criteria.propertySubtype) {
    where.propertySubtype = criteria.propertySubtype;
  }

  // Keyword filter - match any keyword in the keywords array or description
  if (criteria.keywords && criteria.keywords.length > 0) {
    where[Op.or] = criteria.keywords.map(keyword => ({
      [Op.or]: [
        { keywords: { [Op.contains]: [keyword.toLowerCase()] } },
        { description: { [Op.iLike]: `%${keyword}%` } }
      ]
    }));
  }

  const listings = await RetailListing.findAll({
    where,
    order: [['price', 'ASC']],
    limit: 100
  });

  return listings;
}

module.exports = {
  fetchRetailByState,
  fetchRetailByStateBoth,
  fetchRetailByCity,
  fetchRetailFromCities,
  searchRetailListings,
  normalizeRetailListing,
  extractKeywords,
  RETAIL_KEYWORDS,
  FLORIDA_CITIES
};
