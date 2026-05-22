import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Element.prototype.scrollIntoView = vi.fn();

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

/** Chainable Supabase query mock — terminal methods return a resolved promise. */
function createQueryBuilder(result: { data: unknown; error: null } = { data: [], error: null }) {
  const promise = Promise.resolve(result);
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  const terminal = new Set(["limit", "maybeSingle", "single"]);
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "in",
    "gte",
    "ilike",
    "order",
    "limit",
    "maybeSingle",
    "single",
  ];
  for (const m of methods) {
    builder[m] = terminal.has(m) ? vi.fn(() => promise) : vi.fn(chain);
  }
  builder.then = (onFulfilled: (v: typeof result) => unknown) => promise.then(onFulfilled);
  return builder;
}

function mockFrom(table: string) {
  if (table === "events") {
    return createQueryBuilder({ data: null, error: null });
  }
  return createQueryBuilder();
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn((table: string) => mockFrom(table)),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn().mockRejectedValue(new Error("API unavailable in tests")),
  getAccessToken: vi.fn().mockResolvedValue(null),
  API_BASE: "/api/v1",
}));

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  getSocket: vi.fn(() => ({ on: vi.fn(), off: vi.fn() })),
  joinEventRoom: vi.fn(),
  leaveEventRoom: vi.fn(),
}));

vi.mock("@/lib/engagement", () => ({
  logEngagement: vi.fn().mockResolvedValue(undefined),
}));
