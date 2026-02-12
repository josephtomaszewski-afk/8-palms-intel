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
async function fetchRetailByState(state, listingType = 'sale', priceMin = null, priceMax = null) {
  const allListings = [];

  // Determine endpoint based on listing type
  const endpoint = listingType === 'lease'
    ? '/loopnet/lease/searchByState'
    : '/loopnet/sale/searchByState';

  try {
    console.log(`Fetching LoopNet retail listings for ${state} (${listingType})...`);
    console.log(`  Endpoint: ${endpoint}`);

    const requestBody = {
      state: state,
      page: 1
    };
    if (priceMin) requestBody.priceMin = priceMin;
    if (priceMax) requestBody.priceMax = priceMax;

    console.log(`  Request body:`, JSON.stringify(requestBody));

    const response = await loopnetClient.post(endpoint, requestBody);
    const data = response.data;

    console.log(`  Response received, type: ${typeof data}`);
    console.log(`  Response keys:`, data ? Object.keys(data) : 'null');

    // Log a sample of the response to understand structure
    if (data) {
      console.log(`  Response sample:`, JSON.stringify(data).substring(0, 500));
    }

    let rawListings = [];
    if (data && Array.isArray(data.results)) rawListings = data.results;
    else if (data && Array.isArray(data.listings)) rawListings = data.listings;
    else if (data && Array.isArray(data.properties)) rawListings = data.properties;
    else if (data && Array.isArray(data.data)) rawListings = data.data;
    else if (Array.isArray(data)) rawListings = data;

    console.log(`  LoopNet returned ${rawListings.length} raw retail listings`);

    for (const raw of rawListings) {
      const normalized = normalizeRetailListing(raw, listingType);
      if (normalized) allListings.push(normalized);
    }

    // Fetch additional pages (limit to 5 to conserve API calls)
    const totalPages = data?.totalPages || data?.pages || data?.total_pages || 1;
    for (let page = 2; page <= Math.min(totalPages, 5); page++) {
      console.log(`  Fetching page ${page}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const pageResponse = await loopnetClient.post(endpoint, {
          ...requestBody,
          page: page
        });

        const pageData = pageResponse.data;
        let pageListings = [];
        if (pageData && Array.isArray(pageData.results)) pageListings = pageData.results;
        else if (pageData && Array.isArray(pageData.listings)) pageListings = pageData.listings;
        else if (pageData && Array.isArray(pageData.properties)) pageListings = pageData.properties;
        else if (pageData && Array.isArray(pageData.data)) pageListings = pageData.data;
        else if (Array.isArray(pageData)) pageListings = pageData;

        for (const raw of pageListings) {
          const normalized = normalizeRetailListing(raw, listingType);
          if (normalized) allListings.push(normalized);
        }
      } catch (pageError) {
        console.error(`  Error fetching page ${page}:`, pageError.message);
        break;
      }
    }

  } catch (error) {
    console.error(`Error fetching retail listings for ${state}:`, error.message);
    if (error.response) {
      console.error('  Response status:', error.response.status);
      console.error('  Response data:', JSON.stringify(error.response.data).substring(0, 500));
    }
  }

  console.log(`Fetched ${allListings.length} retail listings for ${state}`);
  return allListings;

}

// Fetch both sale and lease listings
async function fetchRetailByStateBoth(state, priceMin = null, priceMax = null) {
  console.log(`Fetching both sale and lease listings for ${state}...`);

  const [saleListings, leaseListings] = await Promise.all([
    fetchRetailByState(state, 'sale', priceMin, priceMax),
    fetchRetailByState(state, 'lease', priceMin, priceMax)
  ]);

  const combined = [...saleListings, ...leaseListings];
  console.log(`Total combined: ${combined.length} (${saleListings.length} sale, ${leaseListings.length} lease)`);

  return combined;
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
  searchRetailListings,
  normalizeRetailListing,
  extractKeywords,
  RETAIL_KEYWORDS
};
