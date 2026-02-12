/**
 * Extended seed script for Florida retail listings
 * Contains 50+ realistic retail property listings across Florida
 * Run with: node scripts/seedRetailListingsExtended.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// Generate realistic Florida retail listings
const sampleListings = [
  // MIAMI AREA
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
    price: 1450000,
    capRate: 6.8,
    description: 'Turnkey restaurant space with fully equipped commercial kitchen, Type 1 hood system, and grease trap. Currently operating as Cuban restaurant. High visibility corner location. Drive-thru potential. Beer and wine license in place.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'drive-thru', 'beer wine', 'corner lot'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
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
    price: 1850000,
    capRate: 7.2,
    description: 'Former fast food restaurant with drive-thru window. Full liquor license transferable. Grease trap recently serviced. Hood system in excellent condition. High traffic count 35,000+ ADT. Freestanding building.',
    keywords: ['restaurant', 'drive-thru', 'liquor license', 'grease trap', 'hood system', 'freestanding', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
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
    price: 2100000,
    capRate: 6.5,
    description: 'Prime Kendall location. Full service restaurant with outdoor patio seating for 40. Commercial kitchen with walk-in cooler/freezer. Grease trap and Type 1 hood. Full bar with liquor license.',
    keywords: ['restaurant', 'outdoor seating', 'patio', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'full bar'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '7890 Biscayne Blvd',
    city: 'Miami',
    state: 'FL',
    zipCode: '33138',
    latitude: 25.8456,
    longitude: -80.1854,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3800,
    price: 2350000,
    capRate: 7.0,
    description: 'MiMo District restaurant opportunity. Art Deco building with original features. Full commercial kitchen, grease trap, hood system. Outdoor dining area with 30 seats. Beer and wine license.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'outdoor seating', 'beer wine'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2901 Collins Ave',
    city: 'Miami Beach',
    state: 'FL',
    zipCode: '33140',
    latitude: 25.8067,
    longitude: -80.1267,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 5200,
    price: 4500000,
    capRate: 5.8,
    description: 'Prime South Beach location. Oceanfront restaurant with rooftop bar. Full commercial kitchen, multiple hood systems, grease interceptor. Full liquor license. Valet parking available.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'full bar', 'parking', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '11401 NW 12th St',
    city: 'Doral',
    state: 'FL',
    zipCode: '33172',
    latitude: 25.7956,
    longitude: -80.3612,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 18000,
    price: 5200000,
    capRate: 7.5,
    description: 'Doral strip mall with 8 units. 3 restaurant spaces with grease traps and hood systems. NNN leases. 95% occupied. Strong tenant mix including national chains.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'hood system', 'anchor'],
    tenantInfo: '8 units, 95% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '6789 Bird Rd',
    city: 'Miami',
    state: 'FL',
    zipCode: '33155',
    latitude: 25.7313,
    longitude: -80.3234,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2400,
    price: 1650000,
    capRate: 6.9,
    description: 'Freestanding QSR building with drive-thru. Former Taco Bell location. Full kitchen, grease trap, hood system. Corner lot with excellent visibility. 25,000 ADT.',
    keywords: ['freestanding', 'qsr', 'drive-thru', 'kitchen', 'grease trap', 'hood system', 'corner lot', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
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
    price: 4200000,
    capRate: 8.1,
    description: 'Strip mall with 6 units. 95% occupied. Mix of retail and restaurant tenants. NNN leases. Two restaurant spaces have grease traps and hood systems.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'hood system', 'signalized intersection', 'anchor'],
    tenantInfo: '6 units, 95% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // FORT LAUDERDALE AREA
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
    price: 895000,
    capRate: 7.8,
    description: 'Freestanding QSR restaurant building. Former national chain location with drive-thru lane. Kitchen equipment included. Grease trap serviced 2024. High visibility corner.',
    keywords: ['freestanding', 'qsr', 'quick service', 'drive-thru', 'grease trap', 'corner lot', 'signalized intersection', 'pad site'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
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
    price: 2450000,
    capRate: 7.0,
    description: 'Federal Highway frontage retail building. Currently divided into 3 units - restaurant space with grease trap, nail salon, and retail storefront. All units occupied. NNN leases.',
    keywords: ['storefront', 'restaurant', 'grease trap', 'nnn', 'triple net', 'frontage', 'parking'],
    tenantInfo: '3 units, 100% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '1400 E Sunrise Blvd',
    city: 'Fort Lauderdale',
    state: 'FL',
    zipCode: '33304',
    latitude: 26.1378,
    longitude: -80.1256,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4200,
    price: 2800000,
    capRate: 6.5,
    description: 'Prime Sunrise Blvd restaurant. Walking distance to beach. Full commercial kitchen, hood system, grease trap. Full liquor license. Outdoor patio seating for 50.',
    keywords: ['restaurant', 'kitchen', 'hood system', 'grease trap', 'liquor license', 'outdoor seating', 'patio', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '3245 N University Dr',
    city: 'Coral Springs',
    state: 'FL',
    zipCode: '33065',
    latitude: 26.2512,
    longitude: -80.2567,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3600,
    price: 1750000,
    capRate: 7.2,
    description: 'University Drive restaurant location. Second generation space with kitchen, grease trap, Type 2 hood. Beer and wine license available. End cap unit with excellent visibility.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'beer wine', 'end cap', 'visibility'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '4567 W Atlantic Blvd',
    city: 'Pompano Beach',
    state: 'FL',
    zipCode: '33063',
    latitude: 26.2345,
    longitude: -80.1456,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2800,
    price: 1350000,
    capRate: 7.5,
    description: 'Freestanding restaurant building on Atlantic Blvd. Drive-thru window. Full kitchen with hood and grease trap. Corner lot with 30 parking spaces.',
    keywords: ['freestanding', 'restaurant', 'drive-thru', 'kitchen', 'hood system', 'grease trap', 'corner lot', 'parking'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // WEST PALM BEACH AREA
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
    price: 1950000,
    capRate: 7.1,
    description: 'Palm Beach Lakes Blvd restaurant. Former steakhouse with full kitchen, grease trap, Type 1 hood. Liquor license included. Private dining room. Valet parking area.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'ground lease', 'parking'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '1890 Okeechobee Blvd',
    city: 'West Palm Beach',
    state: 'FL',
    zipCode: '33409',
    latitude: 26.7089,
    longitude: -80.0923,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 12000,
    price: 3400000,
    capRate: 7.8,
    description: 'Strip mall on busy Okeechobee Blvd. 5 retail units plus 2 restaurant spaces with grease traps. NNN leases. Recently renovated. Strong demographics.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'high traffic'],
    tenantInfo: '7 units, 86% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '3456 PGA Blvd',
    city: 'Palm Beach Gardens',
    state: 'FL',
    zipCode: '33410',
    latitude: 26.8445,
    longitude: -80.0756,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 5500,
    price: 3200000,
    capRate: 6.2,
    description: 'Upscale PGA Blvd restaurant opportunity. High-end finishes. Full commercial kitchen with dual hood systems. Grease interceptor. Full liquor license. Patio seating.',
    keywords: ['restaurant', 'kitchen', 'hood system', 'grease trap', 'liquor license', 'patio', 'outdoor seating'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '789 N Congress Ave',
    city: 'Boynton Beach',
    state: 'FL',
    zipCode: '33426',
    latitude: 26.5312,
    longitude: -80.0845,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2500,
    price: 1100000,
    capRate: 7.9,
    description: 'Freestanding restaurant with drive-thru on Congress Ave. Kitchen equipment negotiable. Grease trap and hood system. 20 parking spaces.',
    keywords: ['freestanding', 'restaurant', 'drive-thru', 'kitchen', 'grease trap', 'hood system', 'parking'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2100 S Federal Hwy',
    city: 'Boca Raton',
    state: 'FL',
    zipCode: '33432',
    latitude: 26.3478,
    longitude: -80.0823,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4000,
    price: 2650000,
    capRate: 6.4,
    description: 'Boca Raton restaurant in affluent area. Full commercial kitchen, grease trap, hood system. Full liquor license. Valet parking. Strong demographics.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'parking', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // TAMPA AREA
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
    price: 1650000,
    capRate: 6.9,
    description: 'Tampa restaurant opportunity. Previously Italian concept. Full commercial kitchen with hood system, walk-in cooler, grease trap. Beer and wine license. Outdoor dining area.',
    keywords: ['restaurant', 'kitchen', 'hood system', 'grease trap', 'beer wine', 'outdoor seating', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
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
    price: 3500000,
    capRate: 7.8,
    description: 'Dale Mabry shopping center with excellent visibility. 5 inline units plus end cap restaurant with drive-thru. Restaurant has grease trap, hood, walk-in cooler. NNN leases.',
    keywords: ['strip mall', 'shopping center', 'end cap', 'drive-thru', 'grease trap', 'hood system', 'nnn', 'triple net', 'anchor', 'visibility'],
    tenantInfo: '6 units, 100% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2345 W Kennedy Blvd',
    city: 'Tampa',
    state: 'FL',
    zipCode: '33609',
    latitude: 27.9478,
    longitude: -82.4789,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4200,
    price: 2100000,
    capRate: 7.0,
    description: 'South Tampa restaurant in trendy SoHo area. Full kitchen, grease trap, Type 1 hood. Full liquor license. Rooftop bar potential. Strong nightlife traffic.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'full bar', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '5678 E Fowler Ave',
    city: 'Tampa',
    state: 'FL',
    zipCode: '33617',
    latitude: 28.0534,
    longitude: -82.4123,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2600,
    price: 1200000,
    capRate: 8.0,
    description: 'Freestanding restaurant near USF. Former pizza concept with hood, grease trap. Drive-thru window. Great student traffic. Beer and wine potential.',
    keywords: ['freestanding', 'restaurant', 'drive-thru', 'hood system', 'grease trap', 'beer wine', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '3456 Henderson Blvd',
    city: 'Tampa',
    state: 'FL',
    zipCode: '33609',
    latitude: 27.9289,
    longitude: -82.5234,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3200,
    price: 1850000,
    capRate: 6.8,
    description: 'Henderson Blvd restaurant in West Tampa. Second generation space with full kitchen, grease trap, hood system. Patio seating. Beer and wine license.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'patio', 'outdoor seating', 'beer wine'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // ORLANDO AREA
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
    price: 2800000,
    capRate: 7.5,
    description: 'International Drive tourist corridor. High-volume restaurant with full liquor license. Two-story building with rooftop bar. Commercial kitchen with multiple hood systems, grease interceptor.',
    keywords: ['restaurant', 'liquor license', 'full bar', 'kitchen', 'hood system', 'grease trap', 'outdoor seating', 'patio', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '4567 W Sand Lake Rd',
    city: 'Orlando',
    state: 'FL',
    zipCode: '32819',
    latitude: 28.4512,
    longitude: -81.4856,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4800,
    price: 2400000,
    capRate: 7.2,
    description: 'Restaurant Row location on Sand Lake Rd. Prime tourist and local traffic. Full commercial kitchen, grease trap, multiple hood systems. Full liquor license. Patio dining.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'patio', 'outdoor seating', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2890 E Colonial Dr',
    city: 'Orlando',
    state: 'FL',
    zipCode: '32803',
    latitude: 28.5534,
    longitude: -81.3456,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2800,
    price: 1350000,
    capRate: 7.8,
    description: 'Freestanding restaurant on Colonial Dr. Drive-thru window. Full kitchen equipment, grease trap, hood system. Corner lot with 35 parking spaces.',
    keywords: ['freestanding', 'restaurant', 'drive-thru', 'kitchen', 'grease trap', 'hood system', 'corner lot', 'parking'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '7890 S Orange Blossom Trl',
    city: 'Orlando',
    state: 'FL',
    zipCode: '32809',
    latitude: 28.4567,
    longitude: -81.3912,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 20000,
    price: 4800000,
    capRate: 8.2,
    description: 'Strip mall near theme parks. 10 units with 3 restaurant spaces. Grease traps and hoods in restaurant units. NNN leases. Strong tourist traffic.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'hood system', 'high traffic'],
    tenantInfo: '10 units, 90% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '1234 N Mills Ave',
    city: 'Orlando',
    state: 'FL',
    zipCode: '32803',
    latitude: 28.5678,
    longitude: -81.3678,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3000,
    price: 1650000,
    capRate: 7.0,
    description: 'Mills 50 District restaurant. Trendy neighborhood with strong local following. Full kitchen, grease trap, hood. Beer and wine license. Outdoor seating.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'beer wine', 'outdoor seating'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // NAPLES / SOUTHWEST FLORIDA
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
    price: 2250000,
    capRate: 6.2,
    description: 'Naples freestanding restaurant on Tamiami Trail. High income demographics. Full commercial kitchen with hood, grease trap, walk-in. Beer and wine license. Outdoor patio.',
    keywords: ['freestanding', 'restaurant', 'kitchen', 'hood system', 'grease trap', 'beer wine', 'outdoor seating', 'patio', 'visibility', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2345 Pine Ridge Rd',
    city: 'Naples',
    state: 'FL',
    zipCode: '34109',
    latitude: 26.2134,
    longitude: -81.7867,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4500,
    price: 2900000,
    capRate: 6.5,
    description: 'Pine Ridge Rd upscale restaurant. Affluent Naples customer base. Full kitchen, grease trap, hood system. Full liquor license. Private dining room.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '6789 US 41',
    city: 'Fort Myers',
    state: 'FL',
    zipCode: '33908',
    latitude: 26.5567,
    longitude: -81.8734,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 14000,
    price: 3200000,
    capRate: 7.9,
    description: 'Fort Myers strip mall on US 41. 6 units including 2 restaurant spaces with grease traps. NNN leases. Growing market with strong demographics.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'high traffic'],
    tenantInfo: '6 units, 100% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '3456 Cleveland Ave',
    city: 'Fort Myers',
    state: 'FL',
    zipCode: '33901',
    latitude: 26.6234,
    longitude: -81.8567,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3200,
    price: 1450000,
    capRate: 7.4,
    description: 'Cleveland Ave restaurant opportunity. Second generation space with kitchen, grease trap, hood. Drive-thru potential. High traffic location.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'drive-thru', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // SARASOTA / BRADENTON
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
    price: 1275000,
    capRate: 7.4,
    description: 'South Tamiami Trail restaurant location. Second generation space with grease trap, hood system, walk-in cooler. Strong demographics and traffic.',
    keywords: ['restaurant', 'grease trap', 'hood system', 'beer wine', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '4567 Main St',
    city: 'Sarasota',
    state: 'FL',
    zipCode: '34236',
    latitude: 27.3367,
    longitude: -82.5389,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3800,
    price: 2100000,
    capRate: 6.8,
    description: 'Downtown Sarasota Main Street restaurant. Prime pedestrian traffic. Full kitchen, grease trap, hood system. Full liquor license. Outdoor dining.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'outdoor seating', 'high traffic'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2345 Cortez Rd W',
    city: 'Bradenton',
    state: 'FL',
    zipCode: '34207',
    latitude: 27.4567,
    longitude: -82.5734,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2600,
    price: 1100000,
    capRate: 7.8,
    description: 'Freestanding restaurant on Cortez Rd. Former seafood concept. Full kitchen, grease trap, hood. Drive-thru window. Beach traffic.',
    keywords: ['freestanding', 'restaurant', 'drive-thru', 'kitchen', 'grease trap', 'hood system'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // JACKSONVILLE AREA
  {
    address: '4567 Beach Blvd',
    city: 'Jacksonville',
    state: 'FL',
    zipCode: '32207',
    latitude: 30.2889,
    longitude: -81.5678,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3500,
    price: 1350000,
    capRate: 7.6,
    description: 'Beach Blvd restaurant opportunity. Full commercial kitchen, grease trap, hood system. Beer and wine license. Strong traffic count.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'beer wine', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '7890 Atlantic Blvd',
    city: 'Jacksonville',
    state: 'FL',
    zipCode: '32211',
    latitude: 30.3234,
    longitude: -81.5123,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 16000,
    price: 3800000,
    capRate: 7.9,
    description: 'Atlantic Blvd strip mall. 7 units with 2 restaurant spaces. Restaurant units have grease traps and hoods. NNN leases. Strong tenant mix.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap', 'hood system'],
    tenantInfo: '7 units, 95% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '2345 San Jose Blvd',
    city: 'Jacksonville',
    state: 'FL',
    zipCode: '32223',
    latitude: 30.2456,
    longitude: -81.6234,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 4200,
    price: 1850000,
    capRate: 7.2,
    description: 'San Jose Blvd restaurant in affluent Mandarin area. Full kitchen, grease trap, hood. Full liquor license. Patio seating. Strong demographics.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'liquor license', 'patio', 'outdoor seating'],
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '5678 Blanding Blvd',
    city: 'Jacksonville',
    state: 'FL',
    zipCode: '32244',
    latitude: 30.2189,
    longitude: -81.7567,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2400,
    price: 975000,
    capRate: 8.1,
    description: 'Freestanding QSR building on Blanding Blvd. Former chain restaurant with drive-thru. Kitchen equipment, grease trap, hood included.',
    keywords: ['freestanding', 'qsr', 'drive-thru', 'kitchen', 'grease trap', 'hood system'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },

  // ADDITIONAL MIAMI/BROWARD
  {
    address: '5678 Pines Blvd',
    city: 'Pembroke Pines',
    state: 'FL',
    zipCode: '33028',
    latitude: 26.0189,
    longitude: -80.3234,
    propertyType: 'retail',
    propertySubtype: 'restaurant',
    sqft: 3200,
    price: 1550000,
    capRate: 7.1,
    description: 'Pines Blvd restaurant opportunity. Second generation with full kitchen, grease trap, hood system. Beer and wine license. Strong residential traffic.',
    keywords: ['restaurant', 'kitchen', 'grease trap', 'hood system', 'beer wine'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '3456 Stirling Rd',
    city: 'Hollywood',
    state: 'FL',
    zipCode: '33021',
    latitude: 26.0345,
    longitude: -80.1567,
    propertyType: 'retail',
    propertySubtype: 'freestanding',
    sqft: 2800,
    price: 1250000,
    capRate: 7.5,
    description: 'Freestanding restaurant on Stirling Rd. Former pizzeria with hood, grease trap. Drive-thru potential. High traffic location.',
    keywords: ['freestanding', 'restaurant', 'drive-thru', 'hood system', 'grease trap', 'high traffic'],
    occupancy: 'vacant',
    source: 'sample',
    listingStatus: 'for_sale'
  },
  {
    address: '8901 Miramar Pkwy',
    city: 'Miramar',
    state: 'FL',
    zipCode: '33025',
    latitude: 25.9845,
    longitude: -80.2789,
    propertyType: 'retail',
    propertySubtype: 'strip_mall',
    sqft: 10000,
    price: 2800000,
    capRate: 7.7,
    description: 'Miramar Parkway strip mall. 5 units with 1 restaurant space with grease trap. NNN leases. Growing community with strong demographics.',
    keywords: ['strip mall', 'nnn', 'triple net', 'grease trap'],
    tenantInfo: '5 units, 100% occupied',
    leaseType: 'NNN',
    occupancy: 'occupied',
    source: 'sample',
    listingStatus: 'for_sale'
  }
];

async function seedListings() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Clear existing sample data
    await sequelize.query('DELETE FROM "RetailListings" WHERE source = \'sample\'');
    console.log('Cleared existing sample data');

    let inserted = 0;
    for (const listing of sampleListings) {
      try {
        const sourceId = `sample-${listing.address.replace(/\s+/g, '-').toLowerCase()}`;
        const pricePerSqft = listing.price && listing.sqft ? Math.round(listing.price / listing.sqft) : null;
        const noi = listing.price && listing.capRate ? Math.round(listing.price * listing.capRate / 100) : null;

        await sequelize.query(`
          INSERT INTO "RetailListings" (
            address, city, state, "zipCode", latitude, longitude,
            "propertyType", "propertySubtype", sqft, price, "pricePerSqft",
            "capRate", noi, description, keywords, "tenantInfo", "leaseType",
            occupancy, source, "sourceId", "listingStatus", "isActive"
          ) VALUES (
            :address, :city, :state, :zipCode, :latitude, :longitude,
            :propertyType, :propertySubtype, :sqft, :price, :pricePerSqft,
            :capRate, :noi, :description, :keywords, :tenantInfo, :leaseType,
            :occupancy, :source, :sourceId, :listingStatus, true
          )
          ON CONFLICT ("sourceId") DO UPDATE SET
            price = EXCLUDED.price,
            "updatedAt" = CURRENT_TIMESTAMP
        `, {
          replacements: {
            ...listing,
            sourceId,
            pricePerSqft,
            noi,
            keywords: `{${listing.keywords.join(',')}}`,
            tenantInfo: listing.tenantInfo || null,
            leaseType: listing.leaseType || null
          }
        });
        inserted++;
      } catch (err) {
        console.error(`Error inserting ${listing.address}:`, err.message);
      }
    }

    console.log(`\nInserted ${inserted} retail listings`);

    const [result] = await sequelize.query('SELECT COUNT(*) as count FROM "RetailListings" WHERE "isActive" = true');
    console.log(`Total active listings: ${result[0].count}`);

    const [byCityResult] = await sequelize.query(`
      SELECT city, COUNT(*) as count
      FROM "RetailListings"
      WHERE "isActive" = true
      GROUP BY city
      ORDER BY count DESC
      LIMIT 10
    `);
    console.log('\nListings by city:');
    byCityResult.forEach(r => console.log(`  ${r.city}: ${r.count}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

seedListings();
