import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, type MemoryRouterProps } from "react-router-dom";
import { configureStore, type PreloadedState } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import uiReducer from "@/store/slices/uiSlice";
import { eventsApi } from "@/store/api/eventsApi";
import { bookingsApi } from "@/store/api/bookingsApi";
import { chatApi } from "@/store/api/chatApi";
import { streamsApi } from "@/store/api/streamsApi";
import { aiApi } from "@/store/api/aiApi";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Profile, UserRole } from "@/types";
import type { RootState } from "@/store";

export function mockUser(role: UserRole, overrides: Partial<Profile> = {}): Profile {
  return {
    id: `user-${role}`,
    email: `${role}@test.com`,
    full_name: `Test ${role}`,
    avatar_url: "",
    role,
    phone: "",
    bio: "",
    company: "",
    website: "",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createTestStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
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
    preloadedState,
  });
}

type Options = {
  route?: string;
  /** When set, wraps `ui` in `<Routes><Route path={routePattern} element={ui} /></Routes>`. */
  routePattern?: string;
  routerProps?: MemoryRouterProps;
  user?: Profile | null;
  loading?: boolean;
} & Omit<RenderOptions, "wrapper">;

export function renderModule(ui: React.ReactElement, options: Options = {}) {
  const {
    route = "/",
    routePattern,
    routerProps,
    user = null,
    loading = false,
    ...renderOptions
  } = options;

  const store = createTestStore({
    auth: { user, loading, error: null },
    ui: { sidebarOpen: true },
  } as PreloadedState<RootState>);

  const routedUi = routePattern ? (
    <Routes>
      <Route path={routePattern} element={ui} />
    </Routes>
  ) : (
    ui
  );

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]} {...routerProps}>
          <ThemeProvider>{children}</ThemeProvider>
        </MemoryRouter>
      </Provider>
    );
  }

  return { ...render(routedUi, { wrapper: Wrapper, ...renderOptions }), store };
}
