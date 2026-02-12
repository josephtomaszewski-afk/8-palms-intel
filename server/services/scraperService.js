/**
 * Web Scraper Service for Commercial Real Estate Listings
 * Scrapes Crexi and LoopNet for retail property data
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

// Retail-related keywords to look for
const RETAIL_KEYWORDS = [
  'restaurant', 'grease trap', 'hood system', 'kitchen', 'drive-thru', 'drive thru',
  'liquor license', 'beer wine', 'full bar', 'outdoor seating', 'patio', 'cafe',
  'fast food', 'qsr', 'quick service', 'retail', 'strip mall', 'shopping center',
  'storefront', 'freestanding', 'pad site', 'end cap', 'nnn', 'triple net'
];

// Extract keywords from text
function extractKeywords(text) {
  if (!text) return [];
  const textLower = text.toLowerCase();
  return RETAIL_KEYWORDS.filter(kw => textLower.includes(kw.toLowerCase()));
}

// Parse price string to number
function parsePrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse sqft string to number
function parseSqft(sqftStr) {
  if (!sqftStr) return null;
  const cleaned = sqftStr.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Scrape Crexi for retail listings
 */
async function scrapeCrexi(state = 'FL', maxPages = 3) {
  const listings = [];
  let browser;

  try {
    console.log(`Starting Crexi scrape for ${state}...`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      // Crexi URL for retail properties for sale in Florida
      const url = `https://www.crexi.com/properties/us/${state.toLowerCase()}/retail/for-sale?page=${pageNum}`;
      console.log(`  Fetching page ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for listings to load
        await page.waitForSelector('.property-card, .listing-card, [data-testid="property-card"]', { timeout: 10000 }).catch(() => {
          console.log('  No property cards found, trying alternate selectors...');
        });

        // Get page content
        const content = await page.content();
        const $ = cheerio.load(content);

        // Try multiple selectors for property cards
        const cards = $('article, .property-card, .listing-card, [class*="PropertyCard"], [class*="ListingCard"]');

        console.log(`  Found ${cards.length} property cards on page ${pageNum}`);

        cards.each((i, card) => {
          try {
            const $card = $(card);

            // Extract address
            const address = $card.find('[class*="address"], [class*="Address"], h2, h3').first().text().trim();

            // Extract price
            const priceText = $card.find('[class*="price"], [class*="Price"]').first().text().trim();
            const price = parsePrice(priceText);

            // Extract location (city, state)
            const locationText = $card.find('[class*="location"], [class*="Location"], [class*="city"]').text().trim();

            // Extract sqft
            const sqftText = $card.find('[class*="sqft"], [class*="size"], [class*="Size"]').text().trim();
            const sqft = parseSqft(sqftText);

            // Extract property type
            const typeText = $card.find('[class*="type"], [class*="Type"], [class*="category"]').text().trim();

            // Extract description/details
            const description = $card.find('[class*="description"], [class*="details"], p').text().trim();

            // Extract link
            let link = $card.find('a').first().attr('href');
            if (link && !link.startsWith('http')) {
              link = `https://www.crexi.com${link}`;
            }

            // Extract image
            const image = $card.find('img').first().attr('src') || $card.find('[style*="background-image"]').first().css('background-image');

            // Only add if we have meaningful data
            if (address && address.length > 5) {
              // Parse city from location or address
              let city = '';
              let zipCode = null;

              if (locationText) {
                const parts = locationText.split(',');
                city = parts[0]?.trim() || '';
              }

              // Extract zip from address
              const zipMatch = (address + ' ' + locationText).match(/\b(\d{5})\b/);
              if (zipMatch) {
                zipCode = zipMatch[1];
              }

              const keywords = extractKeywords(description + ' ' + typeText + ' ' + address);

              listings.push({
                address: address,
                city: city || 'Unknown',
                state: state,
                zipCode: zipCode,
                propertyType: 'retail',
                propertySubtype: determineSubtype(description, typeText),
                sqft: sqft,
                price: price || 0,
                pricePerSqft: price && sqft ? Math.round(price / sqft) : null,
                description: description.substring(0, 2000),
                keywords: keywords,
                source: 'crexi',
                sourceId: `crexi-${address.replace(/\s+/g, '-').substring(0, 50)}-${Date.now()}`,
                sourceUrl: link,
                photoUrl: typeof image === 'string' ? image : null,
                listingStatus: 'for_sale',
                isActive: true,
                lastUpdated: new Date()
              });
            }
          } catch (cardError) {
            console.error('  Error parsing card:', cardError.message);
          }
        });

        // Delay between pages
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (pageError) {
        console.error(`  Error on page ${pageNum}:`, pageError.message);
      }
    }

  } catch (error) {
    console.error('Crexi scrape error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`Crexi scrape complete: ${listings.length} listings found`);
  return listings;
}

/**
 * Scrape LoopNet for retail listings
 */
async function scrapeLoopNet(state = 'FL', maxPages = 3) {
  const listings = [];
  let browser;

  try {
    console.log(`Starting LoopNet scrape for ${state}...`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    // State name mapping
    const stateNames = {
      'FL': 'florida',
      'GA': 'georgia',
      'TX': 'texas',
      'CA': 'california',
      'NY': 'new-york'
    };
    const stateName = stateNames[state] || state.toLowerCase();

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      // LoopNet URL for retail properties for sale
      const url = `https://www.loopnet.com/search/retail-properties/${stateName}/for-sale/?page=${pageNum}`;
      console.log(`  Fetching page ${pageNum}: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for listings
        await page.waitForSelector('.placard, .property-card, article', { timeout: 10000 }).catch(() => {
          console.log('  Waiting for content...');
        });

        // Scroll to load lazy content
        await page.evaluate(() => {
          window.scrollBy(0, 1000);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const content = await page.content();
        const $ = cheerio.load(content);

        // LoopNet uses .placard class for listings
        const cards = $('.placard, article[class*="placard"], div[class*="listing"]');

        console.log(`  Found ${cards.length} property cards on page ${pageNum}`);

        cards.each((i, card) => {
          try {
            const $card = $(card);

            // Extract data using LoopNet's structure
            const address = $card.find('.placard-header-title, [class*="address"], h2, .title').first().text().trim();
            const priceText = $card.find('.placard-header-price, [class*="price"]').first().text().trim();
            const price = parsePrice(priceText);

            const locationText = $card.find('.placard-header-location, [class*="location"]').text().trim();
            const sqftText = $card.find('[class*="size"], [class*="sqft"]').text().trim();
            const sqft = parseSqft(sqftText);

            const capRateText = $card.find('[class*="cap"]').text().trim();
            const capRateMatch = capRateText.match(/(\d+\.?\d*)\s*%/);
            const capRate = capRateMatch ? parseFloat(capRateMatch[1]) : null;

            const description = $card.find('.placard-body, [class*="description"], p').text().trim();

            let link = $card.find('a').first().attr('href');
            if (link && !link.startsWith('http')) {
              link = `https://www.loopnet.com${link}`;
            }

            const image = $card.find('img').first().attr('src');

            if (address && address.length > 5) {
              let city = '';
              let zipCode = null;

              // Parse location
              const locParts = locationText.split(',');
              if (locParts.length > 0) {
                city = locParts[0]?.trim() || '';
              }

              const zipMatch = (address + ' ' + locationText).match(/\b(\d{5})\b/);
              if (zipMatch) {
                zipCode = zipMatch[1];
              }

              const keywords = extractKeywords(description + ' ' + address);

              listings.push({
                address: address,
                city: city || 'Unknown',
                state: state,
                zipCode: zipCode,
                propertyType: 'retail',
                propertySubtype: determineSubtype(description, 'retail'),
                sqft: sqft,
                price: price || 0,
                pricePerSqft: price && sqft ? Math.round(price / sqft) : null,
                capRate: capRate,
                description: description.substring(0, 2000),
                keywords: keywords,
                source: 'loopnet',
                sourceId: `loopnet-${address.replace(/\s+/g, '-').substring(0, 50)}-${Date.now()}`,
                sourceUrl: link,
                photoUrl: image,
                listingStatus: 'for_sale',
                isActive: true,
                lastUpdated: new Date()
              });
            }
          } catch (cardError) {
            console.error('  Error parsing card:', cardError.message);
          }
        });

        // Delay between pages
        if (pageNum < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (pageError) {
        console.error(`  Error on page ${pageNum}:`, pageError.message);
      }
    }

  } catch (error) {
    console.error('LoopNet scrape error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log(`LoopNet scrape complete: ${listings.length} listings found`);
  return listings;
}

// Determine property subtype from description
function determineSubtype(description, typeText) {
  const text = ((description || '') + ' ' + (typeText || '')).toLowerCase();

  if (text.includes('restaurant') || text.includes('kitchen') || text.includes('grease trap')) {
    return 'restaurant';
  }
  if (text.includes('strip') || text.includes('plaza') || text.includes('shopping center')) {
    return 'strip_mall';
  }
  if (text.includes('freestanding') || text.includes('stand alone') || text.includes('pad site')) {
    return 'freestanding';
  }
  if (text.includes('end cap')) {
    return 'end_cap';
  }
  return 'retail';
}

/**
 * Run all scrapers and return combined results
 */
async function scrapeAll(state = 'FL', maxPagesPerSite = 3) {
  console.log(`Starting full scrape for ${state}...`);

  const [crexiListings, loopnetListings] = await Promise.all([
    scrapeCrexi(state, maxPagesPerSite),
    scrapeLoopNet(state, maxPagesPerSite)
  ]);

  const combined = [...crexiListings, ...loopnetListings];
  console.log(`Total scraped: ${combined.length} listings (Crexi: ${crexiListings.length}, LoopNet: ${loopnetListings.length})`);

  return combined;
}

module.exports = {
  scrapeCrexi,
  scrapeLoopNet,
  scrapeAll,
  extractKeywords
};
