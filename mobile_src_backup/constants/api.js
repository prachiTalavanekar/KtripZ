export const BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// export const BASE_URL = 'http://localhost:5000/api'; // iOS simulator
// export const BASE_URL = 'https://api.ktripz.com/api'; // Production

export const SOCKET_URL = 'http://10.0.2.2:5000';

export const ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  FCM_TOKEN: '/auth/fcm-token',
  // Rides
  RIDES: '/rides',
  SEARCH_RIDES: '/rides/search',
  CALCULATE_ROUTE: '/rides/calculate-route',
  MY_RIDES: '/rides/my',
  // Bookings
  BOOKINGS: '/bookings',
  MY_BOOKINGS: '/bookings/my',
  // Payments
  PAYMENT_ORDER: '/payments/order',
  PAYMENT_VERIFY: '/payments/verify',
  PAYMENT_HISTORY: '/payments/history',
  // Vehicles
  VEHICLES: '/vehicles',
  // Messages
  MESSAGES: '/messages',
  // Reviews
  REVIEWS: '/reviews',
  // Users
  USERS: '/users',
  EARNINGS: '/users/earnings',
  // Maps
  AUTOCOMPLETE: '/maps/autocomplete',
};
