"use client";

import { useEffect, useState } from "react";
import { CareerActions } from "./CareerActions";
import careersIndex from "../../data/careers-index.json";
import type { CareerIndex } from "@/types/career";
import { addToRecentlyViewed } from "@/lib/storage";

const allCareers = careersIndex as CareerIndex[];

interface CareerActionsWrapperProps {
  careerSlug: string;
}

export function CareerActionsWrapper({ careerSlug }: CareerActionsWrapperProps) {
  const [career, setCareer] = useState<CareerIndex | null>(null);

  useEffect(() => {
    const found = allCareers.find(c => c.slug === careerSlug);
    if (found) {
      setCareer(found);
      addToRecentlyViewed(careerSlug);
    }
  }, [careerSlug]);

  if (!career) return null;

  return <CareerActions career={career} variant="detail" />;
}

