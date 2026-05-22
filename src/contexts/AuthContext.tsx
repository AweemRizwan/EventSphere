import React, { createContext, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading, fetchProfile } from "@/store/slices/authSlice";
import type { Session } from "@supabase/supabase-js";

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

  const enrichAndSetUser = async (user: any) => {
    try {
      const profile = await dispatch(fetchProfile(user.id)).unwrap();
      // If the profile lacks a role, use the user_metadata role
      if (profile && !profile.role && user.user_metadata?.role) {
        dispatch(setUser({ ...profile, role: user.user_metadata.role }));
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
      dispatch(setLoading(false));
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