"use client";

import BeatCard from "@/components/BeatCard";
import { usePlayer } from "@/components/PlayerContext";

export default function ProfileBeatsClient({ beats }: { beats: any[] }) {
  const { currentBeat, isPlaying, setCurrentBeat } = usePlayer();

  if (beats.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 text-center">
        <p className="text-gray-500">No beats uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {beats.map((beat) => (
        <BeatCard
          key={beat.id}
          beat={beat}
          onPlay={() => setCurrentBeat(beat)}
          isPlaying={isPlaying && currentBeat?.id === beat.id}
        />
      ))}
    </div>
  );
}
