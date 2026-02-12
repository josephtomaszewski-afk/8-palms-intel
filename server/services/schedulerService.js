const cron = require('node-cron');
const { RetailSearch, RetailListing, RetailSearchResult, User } = require('../models');
const { searchRetailListings, fetchRetailByState } = require('./retailDataService');
const { sendNotifications } = require('./notificationService');

let scheduledJobs = [];

/**
 * Run all active retail searches and send notifications for new matches
 */
async function runDailySearches() {
  console.log('Starting daily retail search job...');

  try {
    // Get all active searches with their users
    const searches = await RetailSearch.findAll({
      where: { isActive: true },
      include: [{ model: User }]
    });

    console.log(`Found ${searches.length} active searches to run`);

    for (const search of searches) {
      try {
        console.log(`Running search: ${search.name} (${search.id})`);

        // Run the search
        const listings = await searchRetailListings(search.parsedCriteria);

        // Check for new matches
        const newListings = [];
        for (const listing of listings) {
          const [result, created] = await RetailSearchResult.findOrCreate({
            where: {
              retailSearchId: search.id,
              retailListingId: listing.id
            },
            defaults: {
              matchedAt: new Date(),
              isNew: true
            }
          });

          if (created) {
            newListings.push(listing);
          }
        }

        // Update search metadata
        await search.update({
          lastRunAt: new Date(),
          matchCount: listings.length
        });

        console.log(`  Found ${listings.length} total matches, ${newListings.length} new`);

        // Send notifications if there are new matches
        if (newListings.length > 0 && search.User) {
          const notificationResults = await sendNotifications(search.User, search, newListings);

          // Update notifiedAt for new results
          await RetailSearchResult.update(
            { notifiedAt: new Date() },
            {
              where: {
                retailSearchId: search.id,
                notifiedAt: null
              }
            }
          );

          console.log(`  Notifications sent:`, notificationResults);
        }

      } catch (searchError) {
        console.error(`  Error running search ${search.id}:`, searchError.message);
      }
    }

    console.log('Daily retail search job completed');
  } catch (error) {
    console.error('Error in daily search job:', error.message);
  }
}

/**
 * Refresh retail listings from LoopNet API
 */
async function runDailyRefresh() {
  console.log('Starting daily retail listings refresh...');

  try {
    // Refresh Florida retail listings
    const rawListings = await fetchRetailByState('FL');

    let created = 0, updated = 0, errors = 0;

    for (const listing of rawListings) {
      if (!listing.sourceId || !listing.price) continue;

      try {
        const [record, wasCreated] = await RetailListing.upsert(listing, {
          conflictFields: ['sourceId']
        });
        if (wasCreated) created++;
        else updated++;
      } catch (err) {
        errors++;
      }
    }

    console.log(`Daily refresh complete: ${created} created, ${updated} updated, ${errors} errors`);
  } catch (error) {
    console.error('Error in daily refresh:', error.message);
  }
}

/**
 * Start the scheduler
 */
function startScheduler() {
  // Clear any existing jobs
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];

  // Daily listings refresh at 6am EST (11:00 UTC)
  const refreshJob = cron.schedule('0 11 * * *', async () => {
    console.log('Scheduled job triggered: Daily retail refresh');
    await runDailyRefresh();
  }, {
    timezone: 'America/New_York'
  });
  scheduledJobs.push(refreshJob);

  // Daily search notifications at 8am EST (13:00 UTC)
  const searchJob = cron.schedule('0 13 * * *', async () => {
    console.log('Scheduled job triggered: Daily search notifications');
    await runDailySearches();
  }, {
    timezone: 'America/New_York'
  });
  scheduledJobs.push(searchJob);

  console.log('Retail search scheduler started');
  console.log('  - Daily refresh: 6:00 AM EST');
  console.log('  - Daily notifications: 8:00 AM EST');

  return { refreshJob, searchJob };
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];
  console.log('Retail search scheduler stopped');
}

/**
 * Manually trigger the daily jobs (for testing)
 */
async function triggerManually(jobType = 'all') {
  if (jobType === 'refresh' || jobType === 'all') {
    await runDailyRefresh();
  }
  if (jobType === 'search' || jobType === 'all') {
    await runDailySearches();
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  runDailySearches,
  runDailyRefresh,
  triggerManually
};
