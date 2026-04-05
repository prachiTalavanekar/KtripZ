import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

// Persist user to AsyncStorage so session survives app restarts
const persistUser = async (user) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

const clearSession = async () => {
  await AsyncStorage.multiRemove(['token', 'user']);
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await api.post(ENDPOINTS.LOGIN, credentials);
    await AsyncStorage.setItem('token', data.token);
    await persistUser(data.user);
    return data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await api.post(ENDPOINTS.REGISTER, userData);
    await AsyncStorage.setItem('token', data.token);
    await persistUser(data.user);
    return data;
  } catch (err) { return rejectWithValue(err.message); }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const data = await api.get(ENDPOINTS.ME);
    await persistUser(data);
    return data;
  } catch (err) { return rejectWithValue(err.message); }
});

// Load session from AsyncStorage into Redux on app start
export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const [token, userStr] = await AsyncStorage.multiGet(['token', 'user']);
    const tokenVal = token[1];
    const userVal = userStr[1] ? JSON.parse(userStr[1]) : null;
    if (!tokenVal || !userVal) return rejectWithValue('No session');
    return { token: tokenVal, user: userVal };
  } catch (err) { return rejectWithValue(err.message); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    sessionRestored: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.sessionRestored = true;
      clearSession();
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.token = payload.token;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // register
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.token = payload.token;
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // fetchMe — update user in state and storage
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload;
      })
      // restoreSession
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.token = payload.token;
        state.sessionRestored = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.sessionRestored = true;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
