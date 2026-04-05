import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await api.post(ENDPOINTS.LOGIN, credentials);
    await AsyncStorage.setItem('token', data.token);
    return data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await api.post(ENDPOINTS.REGISTER, userData);
    await AsyncStorage.setItem('token', data.token);
    return data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { return await api.get(ENDPOINTS.ME); }
  catch (err) { return rejectWithValue(err.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: null, loading: false, error: null },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      AsyncStorage.removeItem('token');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };
    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user; state.token = payload.token;
      })
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user; state.token = payload.token;
      })
      .addCase(register.rejected, rejected)
      .addCase(fetchMe.fulfilled, (state, { payload }) => { state.user = payload; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
