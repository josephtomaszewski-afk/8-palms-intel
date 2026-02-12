const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a commercial real estate search assistant for 8 Palms Private Equity Group. Your job is to parse natural language search queries for retail properties and extract structured search criteria.

When given a search query, extract the following information and return it as JSON:
- state: The US state code (e.g., "FL", "TX", "CA"). Default to "FL" if not specified.
- cities: Array of city names mentioned (e.g., ["Miami", "Fort Lauderdale"])
- keywords: Array of relevant keywords from the query (e.g., ["restaurant", "grease trap", "drive-thru"])
- priceMin: Minimum price in dollars (null if not specified)
- priceMax: Maximum price in dollars (null if not specified)
- sqftMin: Minimum square footage (null if not specified)
- sqftMax: Maximum square footage (null if not specified)
- propertySubtype: If specified, one of: "restaurant", "retail", "strip_mall", "freestanding", "end_cap", "inline" (null if not specified)

Common keyword mappings to look for:
- "restaurant" or "food" → include "restaurant" keyword
- "grease trap" or "kitchen" → include "grease trap" keyword
- "drive-thru" or "drive through" → include "drive-thru" keyword
- "liquor" or "bar" → include "liquor license" keyword
- "triple net" or "NNN" → include "nnn" keyword
- "strip mall" or "plaza" or "shopping center" → include "strip mall" keyword

Price parsing examples:
- "$2M" or "$2 million" or "2 million" → 2000000
- "under $1.5M" → priceMax: 1500000
- "between $500K and $2M" → priceMin: 500000, priceMax: 2000000
- "$500K+" or "over $500K" → priceMin: 500000

Also provide a brief, friendly response summarizing what you understood from the query.

Return your response in this exact JSON format:
{
  "criteria": {
    "state": "FL",
    "cities": [],
    "keywords": [],
    "priceMin": null,
    "priceMax": null,
    "sqftMin": null,
    "sqftMax": null,
    "propertySubtype": null
  },
  "response": "I'll search for..."
}`;

async function parseSearchQuery(query) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: query
        }
      ]
    });

    // Extract the text content
    const responseText = message.content[0].text;

    // Parse the JSON from the response
    // Handle case where response might have markdown code blocks
    let jsonStr = responseText;
    if (responseText.includes('```json')) {
      jsonStr = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonStr = responseText.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      criteria: parsed.criteria,
      response: parsed.response
    };
  } catch (error) {
    console.error('Error parsing search query with Claude:', error.message);

    // Return a fallback with basic parsing
    return {
      success: false,
      criteria: basicParse(query),
      response: "I'll search for retail properties matching your query. Let me know if you'd like to refine the search.",
      error: error.message
    };
  }
}

// Basic fallback parser if Claude API fails
function basicParse(query) {
  const queryLower = query.toLowerCase();
  const criteria = {
    state: 'FL',
    cities: [],
    keywords: [],
    priceMin: null,
    priceMax: null,
    sqftMin: null,
    sqftMax: null,
    propertySubtype: null
  };

  // Extract cities (common Florida cities)
  const floridaCities = [
    'miami', 'tampa', 'orlando', 'jacksonville', 'fort lauderdale',
    'west palm beach', 'naples', 'sarasota', 'st petersburg', 'clearwater',
    'boca raton', 'hollywood', 'hialeah', 'coral gables', 'doral'
  ];
  for (const city of floridaCities) {
    if (queryLower.includes(city)) {
      criteria.cities.push(city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  }

  // Extract keywords
  const keywordPatterns = [
    { pattern: /restaurant/i, keyword: 'restaurant' },
    { pattern: /grease trap/i, keyword: 'grease trap' },
    { pattern: /drive.?thru|drive.?through/i, keyword: 'drive-thru' },
    { pattern: /liquor|bar|alcohol/i, keyword: 'liquor license' },
    { pattern: /kitchen/i, keyword: 'kitchen' },
    { pattern: /nnn|triple net/i, keyword: 'nnn' },
    { pattern: /strip mall|plaza|shopping center/i, keyword: 'strip mall' },
    { pattern: /freestanding|stand.?alone/i, keyword: 'freestanding' }
  ];
  for (const { pattern, keyword } of keywordPatterns) {
    if (pattern.test(query)) {
      criteria.keywords.push(keyword);
    }
  }

  // Extract price
  const pricePatterns = [
    { pattern: /under \$?([\d.]+)\s*(m|million|k|thousand)?/i, type: 'max' },
    { pattern: /below \$?([\d.]+)\s*(m|million|k|thousand)?/i, type: 'max' },
    { pattern: /less than \$?([\d.]+)\s*(m|million|k|thousand)?/i, type: 'max' },
    { pattern: /over \$?([\d.]+)\s*(m|million|k|thousand)?/i, type: 'min' },
    { pattern: /above \$?([\d.]+)\s*(m|million|k|thousand)?/i, type: 'min' },
    { pattern: /\$?([\d.]+)\s*(m|million|k|thousand)?\+/i, type: 'min' },
    { pattern: /\$?([\d.]+)\s*(m|million|k|thousand)?/i, type: 'general' }
  ];

  for (const { pattern, type } of pricePatterns) {
    const match = queryLower.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      const multiplier = match[2];
      if (multiplier && (multiplier.toLowerCase() === 'm' || multiplier.toLowerCase() === 'million')) {
        value *= 1000000;
      } else if (multiplier && (multiplier.toLowerCase() === 'k' || multiplier.toLowerCase() === 'thousand')) {
        value *= 1000;
      }

      if (type === 'max') {
        criteria.priceMax = value;
      } else if (type === 'min') {
        criteria.priceMin = value;
      }
      break;
    }
  }

  return criteria;
}

// Generate a conversational response about search results
async function generateResultsResponse(criteria, listingCount) {
  const locationPart = criteria.cities?.length > 0
    ? criteria.cities.join(', ')
    : criteria.state || 'Florida';

  const keywordPart = criteria.keywords?.length > 0
    ? ` with ${criteria.keywords.join(', ')}`
    : '';

  const pricePart = [];
  if (criteria.priceMin) pricePart.push(`above $${(criteria.priceMin / 1000000).toFixed(1)}M`);
  if (criteria.priceMax) pricePart.push(`under $${(criteria.priceMax / 1000000).toFixed(1)}M`);
  const priceStr = pricePart.length > 0 ? ` priced ${pricePart.join(' and ')}` : '';

  if (listingCount === 0) {
    return `I couldn't find any retail properties in ${locationPart}${keywordPart}${priceStr}. Try broadening your search criteria or checking back later for new listings.`;
  }

  return `Found ${listingCount} retail ${listingCount === 1 ? 'property' : 'properties'} in ${locationPart}${keywordPart}${priceStr}. Here are the results:`;
}

module.exports = {
  parseSearchQuery,
  generateResultsResponse,
  basicParse
};
