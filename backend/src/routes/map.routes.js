const router = require('express').Router();
const axios = require('axios');

const OLA_BASE = 'https://api.olamaps.io';

router.get('/autocomplete', async (req, res, next) => {
  try {
    const { input } = req.query;
    const response = await axios.get(`${OLA_BASE}/places/v1/autocomplete`, {
      params: { input, api_key: process.env.OLA_MAPS_API_KEY },
    });
    res.json(response.data);
  } catch (err) { next(err); }
});

router.get('/geocode', async (req, res, next) => {
  try {
    const { address } = req.query;
    const response = await axios.get(`${OLA_BASE}/places/v1/geocode`, {
      params: { address, api_key: process.env.OLA_MAPS_API_KEY },
    });
    res.json(response.data);
  } catch (err) { next(err); }
});

// POST /api/maps/route — get route polyline + ETA from OLA Maps
router.post('/route', async (req, res, next) => {
  try {
    const { origin, destination } = req.body;
    const apiKey = process.env.OLA_MAPS_API_KEY;

    const response = await axios.get(`${OLA_BASE}/routing/v1/directions`, {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        api_key: apiKey,
      },
    });

    const route = response.data.routes?.[0];
    const leg = route?.legs?.[0];

    res.json({
      polyline: route?.overview_polyline?.points || '',
      distance: leg?.distance?.value || 0,
      duration: leg?.duration?.value || 0,
      distanceText: leg?.distance?.text || '',
      durationText: leg?.duration?.text || '',
    });
  } catch (err) {
    // Return empty route on OLA API failure
    res.json({ polyline: '', distance: 0, duration: 0, distanceText: '—', durationText: '—' });
  }
});

// POST /api/maps/stops — fetch bus stands / stops for a city
router.post('/stops', async (req, res, next) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ message: 'city is required' });

    const apiKey = process.env.OLA_MAPS_API_KEY;

    // Search for bus stands, railway stations and landmarks in the city
    const queries = [
      `${city} bus stand`,
      `${city} railway station`,
      `${city} MSRTC`,
    ];

    const results = await Promise.allSettled(
      queries.map(q =>
        axios.get(`${OLA_BASE}/places/v1/textsearch`, {
          params: { textQuery: q, api_key: apiKey },
        })
      )
    );

    const seen = new Set();
    const stops = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const places = result.value.data?.predictions || result.value.data?.results || [];
      for (const place of places) {
        const name = place.description || place.name;
        const lat = place.geometry?.location?.lat ?? place.lat;
        const lng = place.geometry?.location?.lng ?? place.lng;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        stops.push({ name, lat: lat || 0, lng: lng || 0 });
      }
    }

    // Fallback: if Ola returns nothing, use autocomplete
    if (stops.length === 0) {
      const fallback = await axios.get(`${OLA_BASE}/places/v1/autocomplete`, {
        params: { input: `${city} bus stand`, api_key: apiKey },
      });
      const predictions = fallback.data?.predictions || [];
      for (const p of predictions) {
        const name = p.description;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        stops.push({ name, lat: 0, lng: 0 });
      }
    }

    res.json({ stops });
  } catch (err) { next(err); }
});

module.exports = router;
