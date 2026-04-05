import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export const searchRides = createAsyncThunk('rides/search', async (params, { rejectWithValue }) => {
  try { return await api.get(ENDPOINTS.SEARCH_RIDES, { params }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const fetchMyRides = createAsyncThunk('rides/myRides', async (_, { rejectWithValue }) => {
  try { return await api.get(ENDPOINTS.MY_RIDES); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createRide = createAsyncThunk('rides/create', async (data, { rejectWithValue }) => {
  try { return await api.post(ENDPOINTS.RIDES, data); }
  catch (err) { return rejectWithValue(err.message); }
});

const rideSlice = createSlice({
  name: 'rides',
  initialState: { searchResults: [], myRides: [], selectedRide: null, loading: false, error: null },
  reducers: {
    setSelectedRide: (state, { payload }) => { state.selectedRide = payload; },
    updateRideInList: (state, { payload }) => {
      const idx = state.myRides.findIndex(r => r._id === payload._id);
      if (idx !== -1) state.myRides[idx] = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchRides.pending, (state) => { state.loading = true; })
      .addCase(searchRides.fulfilled, (state, { payload }) => { state.loading = false; state.searchResults = payload; })
      .addCase(searchRides.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(fetchMyRides.fulfilled, (state, { payload }) => { state.myRides = payload; })
      .addCase(createRide.fulfilled, (state, { payload }) => { state.myRides.unshift(payload); });
  },
});

export const { setSelectedRide, updateRideInList } = rideSlice.actions;
export default rideSlice.reducer;
