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
    console.log("AuthProvider: Initializing...");

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn(
        "AuthProvider: Session check timeout, setting loading to false"
      );
      setLoading(false);
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        console.log("AuthProvider: Initial session check", {
          session: !!session,
          error,
        });

        // Clear timeout since we got a response
        clearTimeout(timeoutId);

        if (error) {
          console.error("AuthProvider: Session error:", error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("AuthProvider: User found, fetching profile...");
          fetchProfile(session.user.id);
        } else {
          console.log("AuthProvider: No user session");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("AuthProvider: Unexpected session error:", error);
        clearTimeout(timeoutId);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthProvider: Auth state changed:", event, {
        session: !!session,
      });

      // Handle different auth events
      if (event === "SIGNED_OUT") {
        console.log("AuthProvider: User signed out");
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("AuthProvider: User signed in or token refreshed");
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log(
            "AuthProvider: Fetching profile for user:",
            session.user.id
          );
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      // For other events, update user state
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log(
          "AuthProvider: Fetching profile for user:",
          session.user.id
        );
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up subscription");
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (authId: string) => {
    console.log("AuthProvider: fetchProfile called for:", authId);

    try {
      // Set a timeout for profile fetching
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 8000)
      );

      // First, try to get existing profile with timeout
      const profilePromise = supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .maybeSingle();

      let { data, error } = (await Promise.race([
        profilePromise,
        timeoutPromise,
      ])) as any;

      console.log("AuthProvider: Profile query result:", {
        data: !!data,
        error,
      });

      if (
        error &&
        error.code !== "PGRST116" &&
        error.message !== "Profile fetch timeout"
      ) {
        console.error("AuthProvider: Profile fetch error:", error);
        throw error;
      }

      if (data) {
        console.log("AuthProvider: Profile found:", data);
        setProfile(data);
      } else if (error?.message === "Profile fetch timeout") {
        console.warn("AuthProvider: Profile fetch timed out");
        setProfile(null);
      } else {
        console.log("AuthProvider: No profile found, trying to create...");

        // Try to create profile manually if trigger didn't work
        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            auth_id: authId,
            name: "",
            timezone: "UTC",
            language: "en",
            preferred_tone: "calm",
            storage_folder: authId,
          })
          .select()
          .single();

        if (createError) {
          console.error("AuthProvider: Error creating profile:", createError);

          // If creation failed, try fetching again (maybe trigger created it)
          const { data: retryData, error: retryError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", authId)
            .maybeSingle();

          if (retryData) {
            console.log("AuthProvider: Profile found on retry:", retryData);
            setProfile(retryData);
          } else {
            console.error(
              "AuthProvider: Could not create or find profile:",
              retryError
            );
            setProfile(null);
          }
        } else {
          console.log(
            "AuthProvider: Profile created successfully:",
            newProfile
          );
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error("AuthProvider: Unexpected error in fetchProfile:", error);
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
