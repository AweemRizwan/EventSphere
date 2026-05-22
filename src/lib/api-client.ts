import { supabase } from "@/lib/supabase";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api/v1" : "http://localhost:4000/api/v1");

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || "API request failed");
  }
  return res.json() as Promise<T>;
}

export { API_BASE };
