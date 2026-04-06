import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export const fetchMyBookings = createAsyncThunk('bookings/my', async (_, { rejectWithValue }) => {
  try { return await api.get(ENDPOINTS.MY_BOOKINGS); }
  catch (err) { return rejectWithValue(err.message); }
});

export const createBooking = createAsyncThunk('bookings/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post(ENDPOINTS.BOOKINGS, data);
    // res contains { booking, availableSeats }
    return res;
  } catch (err) { return rejectWithValue(err.message); }
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
      .addCase(createBooking.fulfilled, (state, { payload }) => {
        // payload = { booking, availableSeats }
        const booking = payload.booking || payload;
        state.list.unshift(booking);
      });
  },
});

export const { updateBookingStatus } = bookingSlice.actions;
export default bookingSlice.reducer;
