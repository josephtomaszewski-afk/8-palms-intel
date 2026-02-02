/**
 * Import Redfin historical market data into MarketSnapshot table.
 *
 * Usage: node scripts/importRedfinHistory.js /path/to/redfin_fl_filtered.tsv
 *
 * The TSV should be pre-filtered to FL cities from the Redfin city_market_tracker dataset.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const MarketSnapshot = require('../models/MarketSnapshot');

const CITY_TO_METRO = {
  'Tampa': 'Tampa',
  'St Petersburg': 'Tampa',
  'Clearwater': 'Tampa',
  'Orlando': 'Orlando',
  'Kissimmee': 'Orlando',
  'Jacksonville': 'Jacksonville'
};

const PROPERTY_TYPE_MAP = {
  'Single Family Residential': 'single_family',
  'Multi-Family (2-4 Unit)': 'multi_family'
};

async function importData(filePath) {
  await sequelize.authenticate();
  await MarketSnapshot.sync();

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.trim().split('\n');

  // Group data by metro + propertyType + period, then average across cities
  const grouped = {};

  for (const line of lines) {
    const cols = line.split('\t').map(c => c.replace(/^"|"$/g, ''));
    const periodBegin = cols[0]; // 2024-01-01
    const city = cols[8];        // Tampa
    const propType = cols[11];   // Single Family Residential
    const medianSalePrice = parseFloat(cols[13]) || null;
    const medianListPrice = parseFloat(cols[16]) || null;
    const medianPPSF = parseFloat(cols[19]) || null;
    const medianListPPSF = parseFloat(cols[22]) || null;
    const homesSold = parseInt(cols[25]) || 0;
    const inventory = parseInt(cols[34]) || 0;
    const medianDOM = parseInt(cols[40]) || null;

    const metro = CITY_TO_METRO[city];
    const propertyType = PROPERTY_TYPE_MAP[propType];
    if (!metro || !propertyType) continue;

    const period = periodBegin.substring(0, 7); // 2024-01
    const key = `${metro}|${propertyType}|${period}`;

    if (!grouped[key]) {
      grouped[key] = {
        metro, propertyType, period,
        prices: [], listPrices: [], ppsf: [], listPpsf: [],
        sold: 0, inventory: 0, doms: []
      };
    }

    if (medianSalePrice) grouped[key].prices.push(medianSalePrice);
    if (medianListPrice) grouped[key].listPrices.push(medianListPrice);
    if (medianPPSF) grouped[key].ppsf.push(medianPPSF);
    if (medianListPPSF) grouped[key].listPpsf.push(medianListPPSF);
    grouped[key].sold += homesSold;
    grouped[key].inventory += inventory;
    if (medianDOM) grouped[key].doms.push(medianDOM);
  }

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const median = arr => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  let upserted = 0;
  for (const g of Object.values(grouped)) {
    const avgPrice = avg(g.listPrices.length ? g.listPrices : g.prices);
    const medPrice = median(g.listPrices.length ? g.listPrices : g.prices);
    const avgPPSF = avg(g.listPpsf.length ? g.listPpsf : g.ppsf);
    const avgDOM = avg(g.doms);

    await MarketSnapshot.upsert({
      metro: g.metro,
      propertyType: g.propertyType,
      period: g.period,
      avgPrice: avgPrice ? Math.round(avgPrice * 100) / 100 : null,
      medianPrice: medPrice ? Math.round(medPrice * 100) / 100 : null,
      avgPricePerSqft: avgPPSF ? Math.round(avgPPSF * 100) / 100 : null,
      avgDOM: avgDOM ? Math.round(avgDOM * 10) / 10 : null,
      listingCount: g.inventory || g.sold || null
    }, {
      conflictFields: ['metro', 'propertyType', 'period']
    });
    upserted++;
  }

  console.log(`Imported ${upserted} market snapshots`);
  const count = await MarketSnapshot.count();
  console.log(`Total snapshots in DB: ${count}`);

  // Show sample
  const sample = await MarketSnapshot.findAll({
    where: { metro: 'Tampa', propertyType: 'single_family' },
    order: [['period', 'ASC']],
    limit: 5,
    raw: true
  });
  console.log('\nSample (Tampa SFR):');
  sample.forEach(s => console.log(`  ${s.period}: avg $${s.avgPrice}, $/sqft $${s.avgPricePerSqft}, DOM ${s.avgDOM}`));

  await sequelize.close();
}

const filePath = process.argv[2] || '/tmp/redfin_fl_filtered.tsv';
importData(filePath).catch(err => { console.error(err); process.exit(1); });
