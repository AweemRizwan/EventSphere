import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import { eventsApi } from "./api/eventsApi";
import { bookingsApi } from "./api/bookingsApi";
import { chatApi } from "./api/chatApi";
import { streamsApi } from "./api/streamsApi";
import { aiApi } from "./api/aiApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [eventsApi.reducerPath]: eventsApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [streamsApi.reducerPath]: streamsApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      eventsApi.middleware,
      bookingsApi.middleware,
      chatApi.middleware,
      streamsApi.middleware,
      aiApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
