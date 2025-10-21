import { createSlice } from "@reduxjs/toolkit";

const initialState = { token: null, user: null, role: null };

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.token = payload?.token ?? null;      // lưu token/refreshToken nếu muốn
      state.refreshToken = payload?.refreshToken ?? null;
    },
    setUser: (state, { payload }) => {
      state.user = payload || null;              // {driverId, userName, fullName, email, ...}
      state.role = payload?.roles?.[0]?.userType ?? null; // ví dụ lấy role đầu tiên
    },
    logout: () => initialState,
  },
});
export const { setCredentials, setUser, logout } = accountSlice.actions;
export const selectToken = (s) => s.account.token;
export const selectUser  = (s) => s.account.user;
export const selectRole  = (s) => s.account.role;
export default accountSlice.reducer;
