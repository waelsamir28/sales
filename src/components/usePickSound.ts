"use client";

import { useCallback, useEffect, useRef } from "react";

type Ctx = AudioContext | null;

/**
 * Soft "beep" played when an item is picked in the invoice screen.
 * Generated with WebAudio (no asset files) and respects a settings switch.
 */
export function usePickSound(enabled: boolean) {
  const ctxRef = useRef<Ctx>(null);

  useEffect(() => {
    return () => {
      try {
        void ctxRef.current?.close();
      } catch {
        /* ignore */
      }
      ctxRef.current = null;
    };
  }, []);

  return useCallback(
    (variant: "add" | "remove" = "add") => {
      if (!enabled) return;
      try {
        const AudioCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtor) return;
        if (!ctxRef.current) ctxRef.current = new AudioCtor();
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") void ctx.resume();

        const now = ctx.currentTime;
        const notes = variant === "add" ? [880, 1320] : [520, 360];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.055);
          gain.gain.setValueAtTime(0.0001, now + i * 0.055);
          gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.055 + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.1);
          osc.connect(gain).connect(ctx.destination);
          osc.start(now + i * 0.055);
          osc.stop(now + i * 0.055 + 0.12);
        });
      } catch {
        /* audio is a nice-to-have, never break the invoice */
      }
    },
    [enabled],
  );
}
