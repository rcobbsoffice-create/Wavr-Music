"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Beat } from "@/lib/mockData";

interface PlayerContextType {
  currentBeat: Beat | null;
  isPlaying: boolean;
  setCurrentBeat: (beat: Beat | null) => void;
  togglePlay: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  currentBeat: null,
  isPlaying: false,
  setCurrentBeat: () => {},
  togglePlay: () => {},
});

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentBeat, setCurrentBeatState] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function setCurrentBeat(beat: Beat | null) {
    if (beat === null) {
      setCurrentBeatState(null);
      setIsPlaying(false);
    } else if (beat.id === currentBeat?.id) {
      // Same beat clicked — toggle play/pause
      setIsPlaying((p) => !p);
    } else {
      // New beat — increment play count (fire-and-forget)
      fetch(`/api/beats/${beat.id}/play`, { method: "POST" }).catch(() => {});
      setCurrentBeatState(beat);
      setIsPlaying(true);
    }
  }

  function togglePlay() {
    setIsPlaying((p) => !p);
  }

  return (
    <PlayerContext.Provider value={{ currentBeat, isPlaying, setCurrentBeat, togglePlay }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
