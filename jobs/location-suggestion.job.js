const cron = require('node-cron');
const User = require('../models/User');
const notificationService = require('../services/notification.service');

/**
 * Daily Job: 09:00 AM
 * Suggests nearby vendors to users who have a default location set.
 */
const initLocationSuggestionJob = () => {
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('[Job] Starting Daily Vendor Suggestions...');

        try {
            // 1. Get all users who have a location set and are not vendors/admins
            const users = await User.find({
                'defaultLocation.lat': { $exists: true },
                role: 'user'
            });

            for (const user of users) {
                // 2. Find vendors within 10km of user's default location
                // Using simple distance logic for the job (Haversine simulated)
                const vendors = await User.find({
                    role: 'vendor',
                    verifiedVendor: true,
                    'defaultLocation.lat': {
                        $gte: user.defaultLocation.lat - 0.1,
                        $lte: user.defaultLocation.lat + 0.1
                    },
                    'defaultLocation.lng': {
                        $gte: user.defaultLocation.lng - 0.1,
                        $lte: user.defaultLocation.lng + 0.1
                    }
                }).limit(3);

                if (vendors.length > 0) {
                    const shopList = vendors.map(v => `- ${v.shopName}: ${v.shopDescription || 'Great products near you!'}`).join('\n');

                    await notificationService.notify({
                        to: user.email,
                        subject: `New Vendors Near ${user.defaultLocation.address || 'You'}! 📍`,
                        message: `Hello ${user.name},\n\nWe found some spirits and snacks available near your saved location:\n\n${shopList}\n\nCheck them out on Daru Hunting for rapid delivery!\n\nBest,\nDaru Hunting Team`
                    });
                }
            }
            console.log(`[Job] Finished suggestions for ${users.length} users.`);
        } catch (error) {
            console.error('[Job] Location Suggestion Error:', error.message);
        }
    });

    console.log('[Job] Location Suggestion Cron Scheduled (Daily 9:00 AM)');
};

module.exports = initLocationSuggestionJob;
