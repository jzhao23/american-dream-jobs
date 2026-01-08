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
        <video
          src={video.videoUrl}
          poster={video.posterUrl}
          controls
          autoPlay
          className="absolute inset-0 w-full h-full"
          title={`Career video: ${careerTitle}`}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsPlaying(true)}
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-ds-slate group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
      aria-label={`Play career video for ${careerTitle}`}
    >
      {/* Thumbnail */}
      <img
        src={video.posterUrl}
        alt={`Video thumbnail for ${careerTitle}`}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-sage flex items-center justify-center shadow-lg group-hover:bg-sage-dark group-hover:scale-110 transition-all">
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
