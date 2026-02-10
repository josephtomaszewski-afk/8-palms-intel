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

// Florida cities for statewide Value Add Multifamily search
const FLORIDA_CITIES_VALUE_ADD = [
  'Miami', 'Fort Lauderdale', 'West Palm Beach', 'Boca Raton', 'Hollywood',
  'Tampa', 'St Petersburg', 'Orlando', 'Jacksonville', 'Gainesville',
  'Tallahassee', 'Pensacola', 'Fort Myers', 'Naples', 'Sarasota',
  'Daytona Beach', 'Melbourne', 'Port St Lucie', 'Cape Coral', 'Ocala'
];

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

// LoopNet API client for commercial listings
const LOOPNET_HOST = 'loopnet-api.p.rapidapi.com';
const loopnetClient = axios.create({
  baseURL: 'https://loopnet-api.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': LOOPNET_HOST,
    'Content-Type': 'application/json'
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
    description: raw.description?.text || raw.text || null,
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

// Fetch statewide Florida multifamily $3M-$6M for Value Add section
async function fetchValueAddMultifamily() {
  const allListings = [];
  const MIN_PRICE = 3000000;
  const MAX_PRICE = 6000000;

  for (const city of FLORIDA_CITIES_VALUE_ADD) {
    try {
      console.log(`Fetching Value Add multifamily in ${city}, FL...`);
      const params = {
        location: `${city}, FL`,
        status: 'for_sale',
        property_type: 'multi_family',
        price_min: MIN_PRICE,
        price_max: MAX_PRICE,
        sort: 'newest',
        limit: 50
      };

      const response = await apiClient.get('/for-sale', { params });
      const data = response.data;
      let rawListings = [];
      if (data && Array.isArray(data.listings)) rawListings = data.listings;
      else if (Array.isArray(data)) rawListings = data;

      console.log(`  Got ${rawListings.length} raw listings`);

      for (const raw of rawListings) {
        const normalized = normalizeValueAddListing(raw, city);
        if (normalized) allListings.push(normalized);
      }

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching Value Add for ${city}:`, error.message);
    }
  }

  // Dedupe by sourceId
  const seen = new Set();
  const deduped = allListings.filter(l => {
    if (!l.sourceId || seen.has(l.sourceId)) return false;
    seen.add(l.sourceId);
    return true;
  });

  console.log(`Fetched ${deduped.length} Value Add multifamily listings statewide`);
  return deduped;
}

// Normalize listing for Value Add (no Section 8 filters, keep all multifamily $3M-$6M)
function normalizeValueAddListing(raw, city) {
  const desc = raw.description || {};
  const loc = raw.location || {};
  const addr = loc.address || {};
  const coord = addr.coordinate || {};

  const price = parseFloat(raw.list_price || 0);
  if (price < 3000000 || price > 6000000) return null;

  const sqft = parseInt(desc.sqft || 0);
  const pricePerSqft = price && sqft ? (price / sqft) : null;
  const beds = parseInt(desc.beds || 0);
  const baths = parseFloat(desc.baths || 0);

  // Only multifamily
  const rawType = (desc.type || desc.sub_type || '').toLowerCase();
  if (!rawType.includes('multi') && !rawType.includes('duplex') && !rawType.includes('triplex') && !rawType.includes('quadplex') && !rawType.includes('apartment')) {
    return null;
  }

  let daysOnMarket = null;
  if (raw.list_date) {
    daysOnMarket = Math.floor((new Date() - new Date(raw.list_date)) / (1000 * 60 * 60 * 24));
  }

  const addressLine = addr.line || `${addr.street_number || ''} ${addr.street_name || ''} ${addr.street_suffix || ''}`.trim();
  const descriptionText = raw.description?.text || raw.text || '';

  // Determine metro based on city
  let metro = 'Other FL';
  const cityLower = (addr.city || city || '').toLowerCase();
  if (['tampa', 'st petersburg', 'clearwater', 'brandon', 'riverview', 'wesley chapel', 'lakeland'].some(c => cityLower.includes(c))) {
    metro = 'Tampa';
  } else if (['orlando', 'kissimmee', 'sanford', 'winter park', 'clermont'].some(c => cityLower.includes(c))) {
    metro = 'Orlando';
  } else if (['jacksonville', 'orange park', 'st augustine'].some(c => cityLower.includes(c))) {
    metro = 'Jacksonville';
  } else if (['miami', 'fort lauderdale', 'hollywood', 'hialeah', 'coral gables'].some(c => cityLower.includes(c))) {
    metro = 'Miami';
  } else if (['west palm beach', 'boca raton', 'delray beach', 'boynton beach'].some(c => cityLower.includes(c))) {
    metro = 'Palm Beach';
  } else if (['fort myers', 'cape coral', 'naples', 'bonita springs'].some(c => cityLower.includes(c))) {
    metro = 'SW Florida';
  } else if (['sarasota', 'bradenton'].some(c => cityLower.includes(c))) {
    metro = 'Sarasota';
  }

  const priceReductionAmount = raw.price_reduced_amount ? Math.abs(parseFloat(raw.price_reduced_amount)) : null;

  return {
    address: addressLine,
    city: addr.city || city,
    state: addr.state_code || 'FL',
    zipCode: addr.postal_code || null,
    latitude: parseFloat(coord.lat) || null,
    longitude: parseFloat(coord.lon) || null,
    propertyType: 'multi_family',
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
    estimatedRent: null,
    rentalYield: null,
    daysOnMarket,
    priceReductions: priceReductionAmount ? 1 : 0,
    priceReductionAmount,
    metro,
    neighborhood: loc.neighborhoods?.[0]?.name || null,
    source: 'realtor',
    sourceUrl: raw.href || null,
    sourceId: raw.property_id || raw.listing_id || null,
    photoUrl: raw.primary_photo?.href || raw.photos?.[0]?.href || null,
    description: descriptionText,
    listingStatus: raw.status || 'for_sale',
    isActive: true,
    lastUpdated: new Date(),
    isValueAdd: descriptionText.toLowerCase().includes('value add') ||
                descriptionText.toLowerCase().includes('value-add') ||
                descriptionText.toLowerCase().includes('valueadd')
  };
}

// Fetch commercial multifamily listings from LoopNet API
async function fetchLoopNetMultifamily() {
  const allListings = [];
  const MIN_PRICE = 3000000;
  const MAX_PRICE = 6000000;

  try {
    console.log('Fetching LoopNet commercial multifamily listings for Florida...');

    // Use Search By State endpoint for Florida
    const response = await loopnetClient.post('/loopnet/sale/searchByState', {
      state: 'FL',
      propertyType: 'Multifamily',
      priceMin: MIN_PRICE,
      priceMax: MAX_PRICE,
      page: 1
    });

    const data = response.data;
    let rawListings = [];

    // Handle various response shapes
    if (data && Array.isArray(data.results)) {
      rawListings = data.results;
    } else if (data && Array.isArray(data.listings)) {
      rawListings = data.listings;
    } else if (data && Array.isArray(data.properties)) {
      rawListings = data.properties;
    } else if (Array.isArray(data)) {
      rawListings = data;
    }

    console.log(`  LoopNet returned ${rawListings.length} raw listings`);

    for (const raw of rawListings) {
      const normalized = normalizeLoopNetListing(raw);
      if (normalized) allListings.push(normalized);
    }

    // If there are more pages, fetch them (limit to 5 pages to save API calls)
    const totalPages = data?.totalPages || data?.pages || 1;
    for (let page = 2; page <= Math.min(totalPages, 5); page++) {
      console.log(`  Fetching LoopNet page ${page}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const pageResponse = await loopnetClient.post('/loopnet/sale/searchByState', {
          state: 'FL',
          propertyType: 'Multifamily',
          priceMin: MIN_PRICE,
          priceMax: MAX_PRICE,
          page: page
        });

        const pageData = pageResponse.data;
        let pageListings = [];
        if (pageData && Array.isArray(pageData.results)) pageListings = pageData.results;
        else if (pageData && Array.isArray(pageData.listings)) pageListings = pageData.listings;
        else if (pageData && Array.isArray(pageData.properties)) pageListings = pageData.properties;
        else if (Array.isArray(pageData)) pageListings = pageData;

        for (const raw of pageListings) {
          const normalized = normalizeLoopNetListing(raw);
          if (normalized) allListings.push(normalized);
        }
      } catch (pageError) {
        console.error(`  Error fetching LoopNet page ${page}:`, pageError.message);
        break;
      }
    }

  } catch (error) {
    console.error('Error fetching LoopNet listings:', error.message);
    if (error.response) {
      console.error('  Response status:', error.response.status);
      console.error('  Response data:', JSON.stringify(error.response.data).substring(0, 500));
    }
  }

  console.log(`Fetched ${allListings.length} LoopNet commercial multifamily listings`);
  return allListings;
}

// Normalize LoopNet listing to match our schema
function normalizeLoopNetListing(raw) {
  try {
    // LoopNet has different field names - adapt based on actual response
    const price = parseFloat(raw.price || raw.askingPrice || raw.listPrice || 0);
    if (price < 3000000 || price > 6000000) return null;

    const address = raw.address || raw.streetAddress || raw.location?.address || '';
    const city = raw.city || raw.location?.city || '';
    const state = raw.state || raw.location?.state || 'FL';
    const zipCode = raw.zip || raw.zipCode || raw.postalCode || raw.location?.zip || null;

    // Skip if no address
    if (!address || address.length < 5) return null;

    const sqft = parseInt(raw.buildingSize || raw.sqft || raw.squareFeet || raw.size || 0);
    const pricePerSqft = price && sqft ? (price / sqft) : null;

    const units = parseInt(raw.units || raw.numberOfUnits || raw.unitCount || 0);
    const beds = parseInt(raw.beds || raw.bedrooms || units * 2 || 0); // Estimate beds from units
    const baths = parseFloat(raw.baths || raw.bathrooms || units || 0);

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

    // Description text
    const descriptionText = raw.description || raw.remarks || raw.comments || '';

    // Determine metro
    let metro = 'Other FL';
    const cityLower = city.toLowerCase();
    if (['tampa', 'st petersburg', 'clearwater', 'brandon', 'riverview', 'wesley chapel', 'lakeland'].some(c => cityLower.includes(c))) {
      metro = 'Tampa';
    } else if (['orlando', 'kissimmee', 'sanford', 'winter park', 'clermont'].some(c => cityLower.includes(c))) {
      metro = 'Orlando';
    } else if (['jacksonville', 'orange park', 'st augustine'].some(c => cityLower.includes(c))) {
      metro = 'Jacksonville';
    } else if (['miami', 'fort lauderdale', 'hollywood', 'hialeah', 'coral gables', 'doral', 'kendall'].some(c => cityLower.includes(c))) {
      metro = 'Miami';
    } else if (['west palm beach', 'boca raton', 'delray beach', 'boynton beach', 'palm beach'].some(c => cityLower.includes(c))) {
      metro = 'Palm Beach';
    } else if (['fort myers', 'cape coral', 'naples', 'bonita springs', 'estero'].some(c => cityLower.includes(c))) {
      metro = 'SW Florida';
    } else if (['sarasota', 'bradenton', 'venice'].some(c => cityLower.includes(c))) {
      metro = 'Sarasota';
    }

    // Generate a unique source ID
    const sourceId = raw.id || raw.listingId || raw.propertyId || `loopnet-${address.replace(/\s/g, '')}-${zipCode}`;

    return {
      address: address,
      city: city,
      state: state,
      zipCode: zipCode,
      latitude: lat || null,
      longitude: lon || null,
      propertyType: 'multi_family',
      beds: beds,
      baths: baths,
      sqft: sqft,
      lotSize: parseInt(raw.lotSize || raw.landArea || 0) || null,
      yearBuilt: parseInt(raw.yearBuilt || raw.built || 0) || null,
      stories: parseInt(raw.stories || raw.floors || 0) || null,
      garage: null,
      price: price,
      originalPrice: price,
      pricePerSqft: pricePerSqft,
      estimatedRent: null,
      rentalYield: raw.capRate ? parseFloat(raw.capRate) : null,
      daysOnMarket: daysOnMarket,
      priceReductions: 0,
      priceReductionAmount: null,
      metro: metro,
      neighborhood: raw.neighborhood || raw.submarket || null,
      source: 'loopnet',
      sourceUrl: raw.url || raw.detailUrl || raw.link || null,
      sourceId: sourceId,
      photoUrl: raw.image || raw.photo || raw.primaryImage || raw.photos?.[0] || null,
      description: descriptionText,
      listingStatus: 'for_sale',
      isActive: true,
      lastUpdated: new Date(),
      isValueAdd: descriptionText.toLowerCase().includes('value add') ||
                  descriptionText.toLowerCase().includes('value-add') ||
                  descriptionText.toLowerCase().includes('valueadd') ||
                  descriptionText.toLowerCase().includes('upside') ||
                  descriptionText.toLowerCase().includes('below market rent'),
      units: units || null,
      capRate: raw.capRate ? parseFloat(raw.capRate) : null
    };
  } catch (error) {
    console.error('Error normalizing LoopNet listing:', error.message);
    return null;
  }
}

// Combined fetch for Value Add - pulls from both MLS and LoopNet
async function fetchValueAddCombined() {
  console.log('Starting combined Value Add fetch (MLS + LoopNet)...');

  // Fetch from both sources in parallel
  const [mlsListings, loopnetListings] = await Promise.all([
    fetchValueAddMultifamily(),
    fetchLoopNetMultifamily()
  ]);

  console.log(`MLS listings: ${mlsListings.length}, LoopNet listings: ${loopnetListings.length}`);

  // Combine and dedupe by address + zip
  const combined = [...mlsListings];
  const existingAddresses = new Set(mlsListings.map(l => `${l.address.toLowerCase()}-${l.zipCode}`));

  for (const listing of loopnetListings) {
    const key = `${listing.address.toLowerCase()}-${listing.zipCode}`;
    if (!existingAddresses.has(key)) {
      combined.push(listing);
      existingAddresses.add(key);
    }
  }

  console.log(`Combined unique listings: ${combined.length}`);
  return combined;
}

module.exports = {
  fetchAllListings,
  fetchValueAddMultifamily,
  fetchLoopNetMultifamily,
  fetchValueAddCombined,
  scoreListing,
  calculateMarketStats,
  METROS,
  SEARCH_CONFIGS
};
