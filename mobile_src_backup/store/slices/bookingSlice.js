import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export const fetchMyBookings = createAsyncThunk('bookings/my', async (_, { rejectWithValue }) => {
  try { return await api.get(ENDPOINTS.MY_BOOKINGS); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createBooking = createAsyncThunk('bookings/create', async (data, { rejectWithValue }) => {
  try { return await api.post(ENDPOINTS.BOOKINGS, data); }
  catch (err) { return rejectWithValue(err.message); }
});

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: { list: [], loading: false, error: null },
  reducers: {
    updateBookingStatus: (state, { payload }) => {
      const idx = state.list.findIndex(b => b._id === payload._id);
      if (idx !== -1) state.list[idx] = { ...state.list[idx], ...payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.pending, (state) => { state.loading = true; })
      .addCase(fetchMyBookings.fulfilled, (state, { payload }) => { state.loading = false; state.list = payload; })
      .addCase(fetchMyBookings.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(createBooking.fulfilled, (state, { payload }) => { state.list.unshift(payload); });
  },
});

export const { updateBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;
