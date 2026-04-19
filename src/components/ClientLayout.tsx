"use client";

import { ReactNode } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import { PlayerProvider, usePlayer } from "@/components/PlayerContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/components/CartContext";

function LayoutContent({ children }: { children: ReactNode }) {
  const { currentBeat } = usePlayer();
  return (
    <>
      <div className={currentBeat ? "pb-20" : ""}>
        {children}
      </div>
      <AudioPlayer />
    </>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <PlayerProvider>
          <LayoutContent>{children}</LayoutContent>
        </PlayerProvider>
      </CartProvider>
    </AuthProvider>
  );
}
