/**
 * Seed script for sample retail listings
 * Run with: node scripts/seedRetailListings.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Connect to database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Sample Florida retail listings for testing
const sampleListings = [
  {
    address: '1250 NW 7th Ave',
    city: 'Miami',
    state: 'FL',
    zipCode: '33136',
    latitude: 25.7907,
    longitude: -80.2121,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3200,
    lotSize: 5500,
    yearBuilt: 1985,
    price: 1450000,
    pricePerSqft: 453,
    capRate: 6.8,
    noi: 98600,
    daysOnMarket: 45,
    description: 'Turnkey restaurant space with fully equipped commercial kitchen, Type 1 hood system, and grease trap. Currently operating as Cuban restaurant. High visibility corner location. Drive-thru potential. Beer and wine license in place.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'drive-thru', 'beer wine', 'corner lot'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-001',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '8451 S Dixie Hwy',
    city: 'Miami',
    state: 'FL',
    zipCode: '33143',
    latitude: 25.6901,
    longitude: -80.2578,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 2800,
    lotSize: 12000,
    yearBuilt: 1992,
    price: 1850000,
    pricePerSqft: 661,
    capRate: 7.2,
    noi: 133200,
    daysOnMarket: 28,
    description: 'Former fast food restaurant with drive-thru window. Full liquor license transferable. Grease trap recently serviced. Hood system in excellent condition. High traffic count 35,000+ ADT. Freestanding building with monument signage.',
    keywords: ['restaurant', 'drive-thru', 'liquor license', 'grease trap', 'hood system', 'freestanding', 'signage', 'high traffic'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'vacant',
    source: 'sample',
    sourceId: 'sample-retail-002',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '3500 NW 183rd St',
    city: 'Miami Gardens',
    state: 'FL',
    zipCode: '33056',
    latitude: 25.9421,
    longitude: -80.2458,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 15000,
    lotSize: 45000,
    yearBuilt: 2005,
    price: 4200000,
    pricePerSqft: 280,
    capRate: 8.1,
    noi: 340200,
    daysOnMarket: 62,
    description: 'Strip mall with 6 units, 95% occupied. Mix of retail and restaurant tenants. NNN leases in place. Two restaurant spaces have grease traps and hood systems. Anchor tenant is national pizza chain. Signalized intersection with excellent visibility.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'hood system', 'signalized intersection', 'anchor'],
    tenantInfo: '6 units, 95% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-003',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '14255 SW 8th St',
    city: 'Miami',
    state: 'FL',
    zipCode: '33184',
    latitude: 25.7596,
    longitude: -80.4321,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4500,
    lotSize: 18000,
    yearBuilt: 1998,
    price: 2100000,
    pricePerSqft: 467,
    capRate: 6.5,
    noi: 136500,
    daysOnMarket: 15,
    description: 'Prime Kendall location. Full service restaurant with outdoor patio seating for 40. Commercial kitchen with walk-in cooler/freezer. Grease trap and Type 1 hood. Full bar with liquor license. Parking for 45 cars.',
    keywords: ['restaurant', 'outdoor seating', 'patio', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'full bar', 'parking'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-004',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '2901 W Oakland Park Blvd',
    city: 'Fort Lauderdale',
    state: 'FL',
    zipCode: '33311',
    latitude: 26.1663,
    longitude: -80.1521,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2200,
    lotSize: 8500,
    yearBuilt: 1988,
    price: 895000,
    pricePerSqft: 407,
    capRate: 7.8,
    noi: 69810,
    daysOnMarket: 90,
    description: 'Freestanding QSR restaurant building. Former national chain location with drive-thru lane. Kitchen equipment included. Grease trap serviced 2024. High visibility corner with signalized intersection. Pad site perfect for any fast food concept.',
    keywords: ['freestanding', 'qsr', 'quick service', 'drive-thru', 'grease trap', 'corner lot', 'signalized intersection', 'pad site', 'fast food'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'vacant',
    source: 'sample',
    sourceId: 'sample-retail-005',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '5801 N Federal Hwy',
    city: 'Fort Lauderdale',
    state: 'FL',
    zipCode: '33308',
    latitude: 26.1891,
    longitude: -80.1174,
    propertyType: 'retail',
    propertySubtype: 'retail',
    sqft: 6500,
    lotSize: 22000,
    yearBuilt: 2001,
    price: 2450000,
    pricePerSqft: 377,
    capRate: 7.0,
    noi: 171500,
    daysOnMarket: 33,
    description: 'Federal Highway frontage retail building. Currently divided into 3 units - restaurant space with grease trap, nail salon, and retail storefront. All units occupied with strong tenants. NNN leases. Excellent parking ratio.',
    keywords: ['storefront', 'restaurant', 'grease trap', 'nnn', 'triple net', 'frontage', 'parking'],
    tenantInfo: '3 units, 100% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-006',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '4100 W Hillsborough Ave',
    city: 'Tampa',
    state: 'FL',
    zipCode: '33614',
    latitude: 27.9946,
    longitude: -82.4921,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3800,
    lotSize: 15000,
    yearBuilt: 1995,
    price: 1650000,
    pricePerSqft: 434,
    capRate: 6.9,
    noi: 113850,
    daysOnMarket: 55,
    description: 'Tampa restaurant opportunity. Previously operated Italian concept. Full commercial kitchen with hood system, walk-in cooler, grease trap. Beer and wine license available. Outdoor dining area. Strong daytime traffic from nearby office parks.',
    keywords: ['restaurant', 'kitchen', 'hood system', 'grease trap', 'beer wine', 'outdoor seating', 'high traffic'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'vacant',
    source: 'sample',
    sourceId: 'sample-retail-007',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '9821 International Dr',
    city: 'Orlando',
    state: 'FL',
    zipCode: '32819',
    latitude: 28.4538,
    longitude: -81.4701,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 5200,
    lotSize: 20000,
    yearBuilt: 2000,
    price: 2800000,
    pricePerSqft: 538,
    capRate: 7.5,
    noi: 210000,
    daysOnMarket: 22,
    description: 'International Drive tourist corridor location. High-volume restaurant with full liquor license. Two-story building with rooftop bar. Commercial kitchen with multiple hood systems, walk-in coolers, and grease interceptor. Patio seating. 28,000+ ADT.',
    keywords: ['restaurant', 'liquor license', 'full bar', 'kitchen', 'hood system', 'grease trap', 'outdoor seating', 'patio', 'high traffic'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-008',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '7845 N Dale Mabry Hwy',
    city: 'Tampa',
    state: 'FL',
    zipCode: '33614',
    latitude: 28.0156,
    longitude: -82.5026,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 12000,
    lotSize: 35000,
    yearBuilt: 2008,
    price: 3500000,
    pricePerSqft: 292,
    capRate: 7.8,
    noi: 273000,
    daysOnMarket: 78,
    description: 'Dale Mabry shopping center with excellent visibility. 5 inline units plus end cap restaurant space with drive-thru. Restaurant has grease trap, hood system, and walk-in cooler. All NNN leases. Strong anchor tenant mix.',
    keywords: ['strip mall', 'shopping center', 'end cap', 'drive-thru', 'grease trap', 'hood system', 'nnn', 'triple net', 'anchor', 'visibility'],
    tenantInfo: '6 units, 100% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-009',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '2250 Palm Beach Lakes Blvd',
    city: 'West Palm Beach',
    state: 'FL',
    zipCode: '33409',
    latitude: 26.7134,
    longitude: -80.0821,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4800,
    lotSize: 16000,
    yearBuilt: 1990,
    price: 1950000,
    pricePerSqft: 406,
    capRate: 7.1,
    noi: 138450,
    daysOnMarket: 41,
    description: 'Palm Beach Lakes Blvd restaurant. Former steakhouse with full kitchen, grease trap, and Type 1 hood system. Liquor license included. Private dining room. Valet parking area. Ground lease available or fee simple purchase.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'ground lease', 'parking'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'vacant',
    source: 'sample',
    sourceId: 'sample-retail-010',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '4567 Tamiami Trail E',
    city: 'Naples',
    state: 'FL',
    zipCode: '34112',
    latitude: 26.1289,
    longitude: -81.7621,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 3400,
    lotSize: 12500,
    yearBuilt: 2002,
    price: 2250000,
    pricePerSqft: 662,
    capRate: 6.2,
    noi: 139500,
    daysOnMarket: 18,
    description: 'Naples freestanding restaurant on Tamiami Trail. High income demographics. Full commercial kitchen with hood, grease trap, walk-in. Beer and wine license. Outdoor patio with 25 seats. Strong traffic count with great visibility.',
    keywords: ['freestanding', 'restaurant', 'kitchen', 'hood system', 'grease trap', 'beer wine', 'outdoor seating', 'patio', 'visibility', 'high traffic'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'occupied',
    source: 'sample',
    sourceId: 'sample-retail-011',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400',
    listingStatus: 'for_sale',
    isActive: true
  },
  {
    address: '1890 S Tamiami Trail',
    city: 'Sarasota',
    state: 'FL',
    zipCode: '34239',
    latitude: 27.3134,
    longitude: -82.5312,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3000,
    lotSize: 10000,
    yearBuilt: 1996,
    price: 1275000,
    pricePerSqft: 425,
    capRate: 7.4,
    noi: 94350,
    daysOnMarket: 67,
    description: 'South Tamiami Trail restaurant location in Sarasota. Second generation space with grease trap, hood system, walk-in cooler. Can accommodate most restaurant concepts. Strong demographics and traffic. Beer/wine potential.',
    keywords: ['restaurant', 'grease trap', 'hood system', 'beer wine', 'high traffic'],
    tenantInfo: null,
    leaseType: null,
    occupancy: 'vacant',
    source: 'sample',
    sourceId: 'sample-retail-012',
    sourceUrl: 'https://www.loopnet.com',
    photoUrl: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400',
    listingStatus: 'for_sale',
    isActive: true
  }
];

async function seedListings() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Create table if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "RetailListings" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        state VARCHAR(2),
        "zipCode" VARCHAR(10),
        latitude DECIMAL(10, 7),
        longitude DECIMAL(10, 7),
        "propertyType" VARCHAR(50) DEFAULT 'retail',
        "propertySubtype" VARCHAR(50),
        sqft INTEGER,
        "lotSize" INTEGER,
        "yearBuilt" INTEGER,
        price DECIMAL(15, 2),
        "pricePerSqft" DECIMAL(10, 2),
        "capRate" DECIMAL(5, 2),
        noi DECIMAL(15, 2),
        "daysOnMarket" INTEGER,
        description TEXT,
        keywords TEXT[],
        "tenantInfo" TEXT,
        "leaseType" VARCHAR(50),
        occupancy VARCHAR(50),
        source VARCHAR(50) DEFAULT 'loopnet',
        "sourceId" VARCHAR(255) UNIQUE,
        "sourceUrl" TEXT,
        "photoUrl" TEXT,
        "listingStatus" VARCHAR(50) DEFAULT 'for_sale',
        "isActive" BOOLEAN DEFAULT true,
        "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table created/verified');

    // Insert sample listings
    let inserted = 0;
    for (const listing of sampleListings) {
      try {
        await sequelize.query(`
          INSERT INTO "RetailListings" (
            address, city, state, "zipCode", latitude, longitude,
            "propertyType", "propertySubtype", sqft, "lotSize", "yearBuilt",
            price, "pricePerSqft", "capRate", noi, "daysOnMarket",
            description, keywords, "tenantInfo", "leaseType", occupancy,
            source, "sourceId", "sourceUrl", "photoUrl", "listingStatus", "isActive"
          ) VALUES (
            :address, :city, :state, :zipCode, :latitude, :longitude,
            :propertyType, :propertySubtype, :sqft, :lotSize, :yearBuilt,
            :price, :pricePerSqft, :capRate, :noi, :daysOnMarket,
            :description, :keywords, :tenantInfo, :leaseType, :occupancy,
            :source, :sourceId, :sourceUrl, :photoUrl, :listingStatus, :isActive
          )
          ON CONFLICT ("sourceId") DO UPDATE SET
            price = EXCLUDED.price,
            "daysOnMarket" = EXCLUDED."daysOnMarket",
            "updatedAt" = CURRENT_TIMESTAMP
        `, {
          replacements: {
            ...listing,
            keywords: `{${listing.keywords.join(',')}}`
          }
        });
        inserted++;
        console.log(`  Inserted: ${listing.address}, ${listing.city}`);
      } catch (err) {
        console.error(`  Error inserting ${listing.address}:`, err.message);
      }
    }

    console.log(`\nDone! Inserted/updated ${inserted} sample retail listings.`);

    // Show count
    const [result] = await sequelize.query('SELECT COUNT(*) as count FROM "RetailListings"');
    console.log(`Total listings in database: ${result[0].count}`);

  } catch (error) {
    console.error('Error seeding listings:', error);
  } finally {
    await sequelize.close();
  }
}

seedListings();
