"use client";

/**
 * Authentication Context
 *
 * Manages user authentication state across the application.
 * Features:
 * - Email/password sign-in and sign-up via Supabase Auth
 * - Session persistence across page refreshes
 * - Auth modal visibility control
 * - Anonymous-to-authenticated data migration
 *
 * Usage:
 * - Wrap your app with <AuthProvider>
 * - Use useAuth() hook to access auth state and methods
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getSupabaseBrowserClient, isSupabaseAuthEnabled, User, Session } from "./supabase-browser";
import type { AuthError } from "@supabase/supabase-js";

// Types
export interface AuthContextState {
  user: User | null;
  session: Session | null;
  userProfileId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "sign-in" | "sign-up";
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  openAuthModal: (mode?: "sign-in" | "sign-up") => void;
  closeAuthModal: () => void;
}

// Create context
const AuthContext = createContext<AuthContextState | null>(null);

// Storage key for user profile ID
const USER_PROFILE_KEY = "adj_auth_user_profile_id";

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"sign-in" | "sign-up">("sign-in");

  // Check if Supabase auth is configured
  const isAuthEnabled = isSupabaseAuthEnabled();

  // Initialize auth state from Supabase
  useEffect(() => {
    // If Supabase is not configured, skip initialization
    if (!isAuthEnabled) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    // This should never happen since we check isAuthEnabled, but TypeScript needs this
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Load cached user profile ID
      if (session?.user) {
        const cachedProfileId = localStorage.getItem(USER_PROFILE_KEY);
        if (cachedProfileId) {
          setUserProfileId(cachedProfileId);
        }
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        // Fetch or create user profile
        await syncUserProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUserProfileId(null);
        localStorage.removeItem(USER_PROFILE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthEnabled]);

  // Sync user profile with database
  const syncUserProfile = async (authUser: User) => {
    try {
      const response = await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authId: authUser.id,
          email: authUser.email,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.userId) {
        setUserProfileId(data.data.userId);
        localStorage.setItem(USER_PROFILE_KEY, data.data.userId);

        // Migrate anonymous data if this is a new user linking
        if (data.data.isNew === false) {
          await migrateAnonymousData(authUser.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync user profile:", error);
    }
  };

  // Migrate anonymous session data to authenticated user
  const migrateAnonymousData = async (authUserId: string) => {
    try {
      // Get session ID from sessionStorage (used by CareerCompassWizard)
      const compassSession = sessionStorage.getItem("compass-submission");
      if (compassSession) {
        const parsed = JSON.parse(compassSession);
        if (parsed.sessionId) {
          await fetch("/api/auth/migrate-anonymous-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authUserId,
              sessionId: parsed.sessionId,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Failed to migrate anonymous data:", error);
    }
  };

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: { message: "Authentication is not configured", name: "AuthConfigError" } as AuthError };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      setIsAuthModalOpen(false);
    }

    return { error };
  }, []);

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: { message: "Authentication is not configured", name: "AuthConfigError" } as AuthError };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error) {
      setIsAuthModalOpen(false);
    }

    return { error };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    setUserProfileId(null);
    localStorage.removeItem(USER_PROFILE_KEY);
  }, []);

  // Request password reset email
  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: { message: "Authentication is not configured", name: "AuthConfigError" } as AuthError };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  }, []);

  // Update password (used after clicking reset link)
  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { error: { message: "Authentication is not configured", name: "AuthConfigError" } as AuthError };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }, []);

  // Modal controls
  const openAuthModal = useCallback((mode: "sign-in" | "sign-up" = "sign-in") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const value: AuthContextState = {
    user,
    session,
    userProfileId,
    isLoading,
    isAuthenticated: !!user,
    isAuthEnabled,
    isAuthModalOpen,
    authModalMode,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  return !isLoading && isAuthenticated;
}
