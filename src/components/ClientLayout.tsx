"use client";

import { ReactNode, useEffect } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import { PlayerProvider, usePlayer } from "@/components/PlayerContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/components/CartContext";

import SupportAI from "@/components/SupportAI";

function LayoutContent({ children }: { children: ReactNode }) {
  const { currentBeat } = usePlayer();

  useEffect(() => {
    const addGoogleTranslate = () => {
      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        (window as any).googleTranslateElementInit = () => {
          new (window as any).google.translate.TranslateElement(
            { pageLanguage: 'en', layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE },
            'google_translate_element'
          );
        };
      }
    };
    addGoogleTranslate();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        body { top: 0px !important; }
        .goog-te-gadget-icon { display: none !important; }
        .goog-te-gadget-simple { background: transparent !important; border: none !important; color: #0ECCED !important; }
      `}} />
      <div className={currentBeat ? "pb-20" : ""}>
        {children}
      </div>
      <AudioPlayer />
      <SupportAI />
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
