"use client";

import { useState } from "react";
import type { CareerVideo } from "@/types/career";

interface CareerVideoPlayerProps {
  video: CareerVideo;
  careerTitle: string;
}

export function CareerVideoPlayer({ video, careerTitle }: CareerVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
          title={`Career video: ${careerTitle}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsPlaying(true)}
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-secondary-900 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label={`Play career video for ${careerTitle}`}
    >
      {/* Thumbnail */}
      <img
        src={video.thumbnailUrl}
        alt={`Video thumbnail for ${careerTitle}`}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-600 flex items-center justify-center shadow-lg group-hover:bg-primary-700 group-hover:scale-110 transition-all">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
