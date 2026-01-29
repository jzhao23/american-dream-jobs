"use client";

/**
 * Authentication Context (DISABLED for Alpha Launch)
 *
 * This is a stub version of the auth context that maintains the same interface
 * but does not perform actual authentication. This allows existing components
 * to continue working without modification while auth is disabled.
 *
 * Original auth implementation is preserved in:
 * src/lib/_stashed/auth/auth-context.tsx
 *
 * TODO: Re-enable after auth security audit
 */

import {
  createContext,
  useContext,
  ReactNode,
} from "react";

// Stub types to maintain interface compatibility
interface User {
  id: string;
  email?: string;
}

interface Session {
  user: User;
}

interface AuthError {
  message: string;
}

// Types
export interface AuthContextState {
  user: User | null;
  session: Session | null;
  userProfileId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "sign-in" | "sign-up";
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  openAuthModal: (mode?: "sign-in" | "sign-up") => void;
  closeAuthModal: () => void;
}

// Create context with disabled auth state
const AuthContext = createContext<AuthContextState | null>(null);

// Disabled error message
const AUTH_DISABLED_ERROR: AuthError = {
  message: "Authentication is temporarily disabled for alpha launch. Your data is stored locally in your browser.",
};

/**
 * Auth Provider - Stub version for alpha launch
 *
 * All auth operations return errors indicating auth is disabled.
 * User state is always null (not authenticated).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Stub implementations that indicate auth is disabled
  const signIn = async (): Promise<{ error: AuthError | null }> => {
    console.warn("Auth disabled: signIn called but authentication is disabled for alpha launch");
    return { error: AUTH_DISABLED_ERROR };
  };

  const signUp = async (): Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }> => {
    console.warn("Auth disabled: signUp called but authentication is disabled for alpha launch");
    return { error: AUTH_DISABLED_ERROR };
  };

  const signOut = async (): Promise<void> => {
    console.warn("Auth disabled: signOut called but authentication is disabled for alpha launch");
  };

  const resetPassword = async (): Promise<{ error: AuthError | null }> => {
    console.warn("Auth disabled: resetPassword called but authentication is disabled for alpha launch");
    return { error: AUTH_DISABLED_ERROR };
  };

  const updatePassword = async (): Promise<{ error: AuthError | null }> => {
    console.warn("Auth disabled: updatePassword called but authentication is disabled for alpha launch");
    return { error: AUTH_DISABLED_ERROR };
  };

  const openAuthModal = (): void => {
    console.warn("Auth disabled: openAuthModal called but authentication is disabled for alpha launch");
    // Could optionally show a message to users here
  };

  const closeAuthModal = (): void => {
    // No-op
  };

  const value: AuthContextState = {
    user: null,
    session: null,
    userProfileId: null,
    isLoading: false, // Not loading since auth is disabled
    isAuthenticated: false,
    isAuthModalOpen: false,
    authModalMode: "sign-in",
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

/**
 * Hook to use auth context
 *
 * Returns stub auth state with isAuthenticated always false.
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user is authenticated
 *
 * Always returns false since auth is disabled.
 */
export function useIsAuthenticated(): boolean {
  return false;
}
