"use client";

/**
 * Location Context
 *
 * Manages user location state across the application.
 * Features:
 * - Auto-detection via Vercel geo headers
 * - Manual location selection
 * - localStorage persistence
 * - Prompt dismissal tracking
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// Types
export interface LocationInfo {
  code: string;
  name: string;
  shortName: string;
  state: string;
  type: "msa" | "state";
}

interface StoredLocation {
  location: LocationInfo;
  source: "auto" | "manual";
  setAt: string;
}

interface LocationContextState {
  location: LocationInfo | null;
  isLoading: boolean;
  isDetecting: boolean;
  source: "auto" | "manual" | null;
  promptDismissed: boolean;
  setLocation: (location: LocationInfo, source?: "auto" | "manual") => void;
  clearLocation: () => void;
  detectLocation: () => Promise<LocationInfo | null>;
  dismissPrompt: () => void;
}

const STORAGE_KEY = "adj-location";
const DISMISSED_KEY = "adj-location-dismissed";

// Create context
const LocationContext = createContext<LocationContextState | null>(null);

// Provider component
export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationInfo | null>(null);
  const [source, setSource] = useState<"auto" | "manual" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      // Check if prompt was dismissed
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === "true") {
        setPromptDismissed(true);
      }

      // Load saved location
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredLocation = JSON.parse(stored);
        setLocationState(parsed.location);
        setSource(parsed.source);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Failed to load location from storage:", error);
    }

    // No saved location, try auto-detection
    setIsLoading(false);
    detectLocationInternal();
  }, []);

  // Auto-detect location
  const detectLocationInternal = async (): Promise<LocationInfo | null> => {
    setIsDetecting(true);

    try {
      const response = await fetch("/api/location/detect");
      const data = await response.json();

      if (data.success && data.detected && data.location) {
        const locationInfo: LocationInfo = {
          code: data.location.code,
          name: data.location.name,
          shortName: data.location.shortName,
          state: data.location.state,
          type: data.locationType,
        };

        // Auto-save detected location
        setLocationState(locationInfo);
        setSource("auto");
        saveToStorage(locationInfo, "auto");

        setIsDetecting(false);
        return locationInfo;
      }
    } catch (error) {
      console.error("Location detection failed:", error);
    }

    setIsDetecting(false);
    return null;
  };

  // Public detect function
  const detectLocation = useCallback(async (): Promise<LocationInfo | null> => {
    return detectLocationInternal();
  }, []);

  // Save to localStorage
  const saveToStorage = (loc: LocationInfo, src: "auto" | "manual") => {
    try {
      const stored: StoredLocation = {
        location: loc,
        source: src,
        setAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error("Failed to save location to storage:", error);
    }
  };

  // Set location manually
  const setLocation = useCallback(
    (loc: LocationInfo, src: "auto" | "manual" = "manual") => {
      setLocationState(loc);
      setSource(src);
      saveToStorage(loc, src);
      // Clear dismissed state when user sets location
      setPromptDismissed(false);
      localStorage.removeItem(DISMISSED_KEY);
    },
    []
  );

  // Clear location
  const clearLocation = useCallback(() => {
    setLocationState(null);
    setSource(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear location from storage:", error);
    }
  }, []);

  // Dismiss prompt
  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch (error) {
      console.error("Failed to save dismissed state:", error);
    }
  }, []);

  const value: LocationContextState = {
    location,
    isLoading,
    isDetecting,
    source,
    promptDismissed,
    setLocation,
    clearLocation,
    detectLocation,
    dismissPrompt,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// Hook to use location context
export function useLocation(): LocationContextState {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}

// Hook to check if location is available
export function useHasLocation(): boolean {
  const { location, isLoading } = useLocation();
  return !isLoading && location !== null;
}
