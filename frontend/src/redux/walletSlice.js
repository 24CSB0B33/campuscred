import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

// Fetch the logged-in user's profile (includes credit balance)
export const fetchProfile = createAsyncThunk('wallet/fetchProfile', async () => {
  const res = await api.get('/users/me');
  return res.data;
});

export const fetchTransactions = createAsyncThunk('wallet/fetchTransactions', async () => {
  const res = await api.get('/users/me/transactions');
  return res.data;
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    profile: null,
    transactions: [],
    status: 'idle',
  },
  reducers: {
    // Optimistic local update after booking/completing a session,
    // reconciled by the next fetchProfile call
    adjustCreditsLocally: (state, action) => {
      if (state.profile) state.profile.credits += action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      });
  },
});

export const { adjustCreditsLocally } = walletSlice.actions;
export default walletSlice.reducer;
