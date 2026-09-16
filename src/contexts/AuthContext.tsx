import React, { createContext, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading, fetchProfile } from "@/store/slices/authSlice";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextValue {
  session: Session | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [session, setSession] = React.useState<Session | null>(null);

  const buildFallbackProfile = (user: User) => ({
    id: user.id,
    email: user.email || "",
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    avatar_url: user.user_metadata?.avatar_url || "",
    role: (user.user_metadata?.role || "attendee") as "admin" | "organizer" | "attendee" | "sponsor",
    phone: "",
    bio: "",
    company: "",
    website: "",
    is_active: true,
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
  });

  const enrichAndSetUser = async (user: User) => {
    try {
      const profile = await dispatch(fetchProfile(user.id)).unwrap();
      if (!profile) {
        dispatch(setUser(buildFallbackProfile(user)));
        return;
      }
      dispatch(setUser({
        ...profile,
        role: profile.role || (user.user_metadata?.role as typeof profile.role) || "attendee",
      }));
    } catch (e) {
      console.error("Failed to fetch profile", e);
      dispatch(setUser(buildFallbackProfile(user)));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        enrichAndSetUser(session.user);
      } else {
        dispatch(setLoading(false));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          enrichAndSetUser(session.user);
        } else {
          dispatch(setUser(null));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch]);

  const signOut = async () => {
    await supabase.auth.signOut();
    dispatch(setUser(null));
  };

  return (
    <AuthContext.Provider value={{ session, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);