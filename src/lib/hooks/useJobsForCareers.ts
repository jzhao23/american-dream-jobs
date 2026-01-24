"use client";

/**
 * useJobsForCareers Hook
 *
 * Fetches job listings for multiple careers in parallel.
 * Returns a map of careerSlug -> JobListing[]
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { JobListing } from "@/lib/jobs/types";
import { LocationInfo } from "@/lib/location-context";

interface CareerInfo {
  slug: string;
  title: string;
}

interface UseJobsForCareersResult {
  jobsByCareer: Record<string, JobListing[]>;
  allJobs: Array<JobListing & { careerSlug: string; careerTitle: string }>;
  isLoading: boolean;
  error: string | null;
  totalJobCount: number;
  refetch: () => void;
}

// Helper to fetch jobs one at a time to avoid overwhelming the browser
async function fetchJobsSequentially(
  careers: CareerInfo[],
  location: LocationInfo,
  limit: number
): Promise<Record<string, JobListing[]>> {
  const jobsMap: Record<string, JobListing[]> = {};

  for (const career of careers) {
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerSlug: career.slug,
          careerTitle: career.title,
          locationCode: location.code,
          locationName: location.shortName,
          limit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // API returns { success, data: { jobs: [] } }
        const jobs = data.data?.jobs || data.jobs || [];
        if (jobs.length > 0) {
          jobsMap[career.slug] = jobs;
        }
      }
    } catch {
      // Silently ignore individual failures
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return jobsMap;
}

export function useJobsForCareers(
  careers: CareerInfo[],
  location: LocationInfo | null,
  limit: number = 3
): UseJobsForCareersResult {
  const [jobsByCareer, setJobsByCareer] = useState<Record<string, JobListing[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track what we've already fetched to prevent duplicate requests
  const lastFetchKey = useRef<string>("");
  const isFetching = useRef(false);

  // Create a stable key for the current request
  const fetchKey = careers.map(c => c.slug).sort().join(',') + '|' + (location?.code || '');

  useEffect(() => {
    // Don't fetch if no location or no careers
    if (!location || careers.length === 0) {
      setJobsByCareer({});
      return;
    }

    // Don't fetch if we already fetched this exact combination
    if (fetchKey === lastFetchKey.current) {
      return;
    }

    // Don't start a new fetch if one is in progress
    if (isFetching.current) {
      return;
    }

    const doFetch = async () => {
      isFetching.current = true;
      lastFetchKey.current = fetchKey;
      setIsLoading(true);
      setError(null);

      try {
        const jobsMap = await fetchJobsSequentially(careers, location, limit);
        setJobsByCareer(jobsMap);
      } catch (err) {
        console.error("Error fetching jobs for careers:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
        setJobsByCareer({});
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    };

    doFetch();
  }, [fetchKey, careers, location, limit]);

  // Compute allJobs with career info attached
  const allJobs = Object.entries(jobsByCareer).flatMap(([slug, jobs]) => {
    const career = careers.find((c) => c.slug === slug);
    return jobs.map((job) => ({
      ...job,
      careerSlug: slug,
      careerTitle: career?.title || slug,
    }));
  });

  const totalJobCount = Object.values(jobsByCareer).reduce(
    (sum, jobs) => sum + jobs.length,
    0
  );

  const refetch = useCallback(() => {
    // Clear the cache to force refetch
    lastFetchKey.current = "";
  }, []);

  return {
    jobsByCareer,
    allJobs,
    isLoading,
    error,
    totalJobCount,
    refetch,
  };
}
