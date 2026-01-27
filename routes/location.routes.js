const router = require('express').Router();
const fetch = require('node-fetch');
const { auth } = require('../middleware/auth');

// Reverse Geocode: lat,lng -> address
router.get('/reverse', auth(['user', 'vendor', 'admin']), async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'SpiritLiquor/1.0' } });
        const data = await response.json();

        res.json({ address: data.display_name });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch address', error: err.message });
    }
});

// Calculate Distance & Time
router.get('/calculate', auth(['user', 'vendor', 'admin']), (req, res) => {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({ message: 'Missing origin or destination coordinates' });
    }

    const R = 6371; // Earth's radius in KM
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLon = (destLng - originLng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Estimate time (average speed 25km/h for city traffic)
    const timeMinutes = Math.round((distanceKm / 25) * 60);

    res.json({
        distance: distanceKm < 1 ? Math.round(distanceKm * 1000) : Number(distanceKm.toFixed(2)),
        unit: distanceKm < 1 ? 'm' : 'km',
        estimatedTime: timeMinutes,
        text: `${distanceKm < 1 ? Math.round(distanceKm * 1000) + ' m' : distanceKm.toFixed(2) + ' km'} (${timeMinutes} mins)`
    });
});

const User = require('../models/User');

// Update user's default location
router.put('/default', auth(['user', 'vendor', 'admin']), async (req, res) => {
    const { lat, lng, address } = req.body;

    // Validate coordinates
    if (lat === undefined || lng === undefined) {
        return res.status(400).json({ message: 'lat and lng are required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.defaultLocation = { lat, lng, address: address || user.defaultLocation?.address };
        await user.save();

        res.json({ message: 'Default location updated successfully', location: user.defaultLocation });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update location', error: err.message });
    }
});

// Location Search (Autocomplete): query -> address suggestions
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q) return res.status(400).json({ message: 'Query string required' });

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=np&limit=5`;
        const response = await fetch(url, { headers: { 'User-Agent': 'SpiritLiquor/1.0' } });
        const data = await response.json();

        const suggestions = data.map(item => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        }));

        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to search location', error: err.message });
    }
});

module.exports = router;
