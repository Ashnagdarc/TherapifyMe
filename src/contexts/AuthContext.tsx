import { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User } from "../types/database";

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log("AuthProvider: Fetching profile for user:", userId);
    setLoading(true);
    try {
      const { data, error, status } = await supabase
        .from("users")
        .select(`*`)
        .eq("auth_id", userId)
        .single();

      if (error && status !== 406) {
        console.error("AuthProvider: Profile fetch error:", error);
        setProfile(null);
      } else if (data) {
        console.log("AuthProvider: Profile found:", data);
        setProfile(data);
      }
    } catch (error) {
      console.error("AuthProvider: Unexpected error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("AuthProvider: Signing in...");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("AuthProvider: Sign in error:", error);
      setLoading(false);
      throw error;
    }

    console.log("AuthProvider: Sign in successful");
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log("AuthProvider: Signing up...");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error("AuthProvider: Sign up error:", error);
      setLoading(false);
      throw error;
    }

    console.log("AuthProvider: Sign up successful");
  };

  const signOut = async () => {
    console.log("AuthProvider: Signing out...");

    try {
      // Set loading state during sign out
      setLoading(true);

      // Clear local state immediately
      setUser(null);
      setProfile(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("AuthProvider: Sign out error:", error);
        // Don't throw error - still clear local state
      }

      // Clear any cached data in localStorage
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();

      console.log("AuthProvider: Sign out successful");

      // Force page reload to ensure clean state
      window.location.href = "/";
    } catch (error) {
      console.error("AuthProvider: Unexpected sign out error:", error);
      // Still clear state and redirect
      setUser(null);
      setProfile(null);
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error("No authenticated user");

    console.log("AuthProvider: Updating profile:", updates);

    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("auth_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("AuthProvider: Profile update error:", error);
      throw error;
    }

    console.log("AuthProvider: Profile updated:", data);
    setProfile(data);
  };

  console.log("AuthProvider: Current state:", {
    user: !!user,
    profile: !!profile,
    loading,
    userId: user?.id,
    profileId: profile?.id,
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
