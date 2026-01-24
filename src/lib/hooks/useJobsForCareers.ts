"use client";

/**
 * useJobsForCareers Hook
 *
 * Fetches job listings for multiple careers in parallel.
 * Returns a map of careerSlug -> JobListing[]
 */

import { useState, useEffect, useCallback } from "react";
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

// Helper to fetch jobs sequentially in batches to avoid overwhelming the browser
async function fetchJobsInBatches(
  careers: CareerInfo[],
  location: LocationInfo,
  limit: number,
  batchSize: number = 3
): Promise<Record<string, JobListing[]>> {
  const jobsMap: Record<string, JobListing[]> = {};

  // Process in batches
  for (let i = 0; i < careers.length; i += batchSize) {
    const batch = careers.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (career) => {
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

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs for ${career.title}`);
        }

        const data = await response.json();
        return {
          slug: career.slug,
          jobs: data.jobs || [],
        };
      })
    );

    // Process batch results
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.jobs.length > 0) {
        jobsMap[result.value.slug] = result.value.jobs;
      }
    });

    // Small delay between batches to prevent overwhelming the browser
    if (i + batchSize < careers.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
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
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const fetchJobs = useCallback(async () => {
    // Don't fetch if no location or no careers
    if (!location || careers.length === 0) {
      setJobsByCareer({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch jobs in batches of 3 to avoid overwhelming the browser
      const jobsMap = await fetchJobsInBatches(careers, location, limit, 3);
      setJobsByCareer(jobsMap);
    } catch (err) {
      // Silently fail - don't show error to user
      console.error("Error fetching jobs for careers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      setJobsByCareer({});
    } finally {
      setIsLoading(false);
    }
  }, [careers, location, limit]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, fetchTrigger]);

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
    setFetchTrigger((prev) => prev + 1);
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
