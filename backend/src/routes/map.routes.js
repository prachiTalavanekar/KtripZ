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

module.exports = router;
