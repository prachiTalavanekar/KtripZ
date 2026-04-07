import React, { createContext, useContext, useState, useRef } from 'react';

const RideTrackingContext = createContext(null);

export function RideTrackingProvider({ children }) {
  const [trackingState, setTrackingState] = useState({
    bookingId: null,
    rideId: null,
    driverLocation: null,   // { lat, lng, heading, speed }
    passengerLocation: null,// { lat, lng }
    routePolyline: [],      // decoded coords array
    eta: null,              // seconds
    distance: null,         // meters
    etaText: '',
    distanceText: '',
    rideStatus: null,       // 'approved' | 'driver_arriving' | 'otp_pending' | 'ride_started' | 'completed'
    otpRequired: false,
    otpVerified: false,
    otp: null,
  });

  const locationWatcher = useRef(null);

  const updateTracking = (updates) =>
    setTrackingState(prev => ({ ...prev, ...updates }));

  const resetTracking = () => {
    setTrackingState({
      bookingId: null, rideId: null, driverLocation: null,
      passengerLocation: null, routePolyline: [], eta: null,
      distance: null, etaText: '', distanceText: '',
      rideStatus: null, otpRequired: false, otpVerified: false, otp: null,
    });
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
  };

  return (
    <RideTrackingContext.Provider value={{ trackingState, updateTracking, resetTracking, locationWatcher }}>
      {children}
    </RideTrackingContext.Provider>
  );
}

export const useRideTracking = () => {
  const ctx = useContext(RideTrackingContext);
  if (!ctx) throw new Error('useRideTracking must be inside RideTrackingProvider');
  return ctx;
};
