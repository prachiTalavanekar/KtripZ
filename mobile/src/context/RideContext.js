import React, { createContext, useContext, useState } from 'react';

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const [rideDraft, setRideDraft] = useState({
    fromStop: null,   // { name, lat, lng }
    toStop: null,
    date: '',
    time: '',
    seats: '',
    price: '',
    vehicleId: '',
    description: '',
  });

  const updateDraft = (key, value) =>
    setRideDraft(prev => ({ ...prev, [key]: value }));

  const resetDraft = () =>
    setRideDraft({ fromStop: null, toStop: null, date: '', time: '', seats: '', price: '', vehicleId: '', description: '' });

  return (
    <RideContext.Provider value={{ rideDraft, updateDraft, resetDraft }}>
      {children}
    </RideContext.Provider>
  );
}

export const useRide = () => {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used inside RideProvider');
  return ctx;
};
