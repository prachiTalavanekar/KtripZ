import api from './api';

/**
 * Fetch stops/bus stands for a given city from backend
 * POST /api/maps/stops
 * @param {string} city
 * @returns {Promise<Array<{name: string, lat: number, lng: number}>>}
 */
export const getStops = async (city) => {
  const data = await api.post('/maps/stops', { city });
  return data.stops || [];
};
