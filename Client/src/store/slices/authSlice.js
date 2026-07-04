import { createSlice } from "@reduxjs/toolkit";

// Decode JWT exp claim without any library
function isTokenAlive(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 > Date.now() - 10_000; // 10-second grace
    } catch {
        return false;
    }
}

const storedToken = localStorage.getItem("token");
const tokenValid  = isTokenAlive(storedToken);

// Wipe expired session immediately — prevents 401 floods on page reload
if (storedToken && !tokenValid) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

const storedUser = tokenValid
    ? (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })()
    : null;

const initialState = {
    user: storedUser,
    token: tokenValid ? storedToken : null,
    isAuthenticated: tokenValid,
    loading: false,
    error: null,
    // In-memory only — never persisted to localStorage
    // Holds credentials for auto-login after checkout registration
    pendingAutoLoginEmail: null,
    pendingAutoLoginPassword: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = {
                id: action.payload.id,
                name: action.payload.name,
                email: action.payload.email,
                phone: action.payload.phone,
                role: action.payload.role
            };
            // Only update token if it's provided in the payload (login/register)
            if (action.payload.token) {
                state.token = action.payload.token;
                localStorage.setItem("token", action.payload.token);
            }
            localStorage.setItem("user", JSON.stringify(state.user));
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.isAuthenticated = false;
        },
        updatePasswordStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updatePasswordSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    updatePasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
        logoutAction: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.pendingAutoLoginEmail = null;
            state.pendingAutoLoginPassword = null;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        },
        // Store pending credentials for auto-login after checkout registration
        // These are IN-MEMORY ONLY and never written to localStorage
        storePendingAutoLogin: (state, action) => {
            state.pendingAutoLoginEmail = action.payload.email;
            state.pendingAutoLoginPassword = action.payload.password;
        },
        clearPendingAutoLogin: (state) => {
            state.pendingAutoLoginEmail = null;
            state.pendingAutoLoginPassword = null;
        },
    }
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logoutAction,
    storePendingAutoLogin,
    clearPendingAutoLogin,
} = authSlice.actions;
export default authSlice.reducer;