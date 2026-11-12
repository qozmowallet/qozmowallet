"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { MotionConfig, useInView } from "motion/react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

interface MotionSettings {
  enabled: boolean;
  systemReduced: boolean;
}

const MotionSettingsContext = createContext<MotionSettings | null>(null);

/** One preference shared by the Magic UI components and decorative CSS motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
  const enabled = !systemReduced;
  const settings = useMemo(
    () => ({ enabled, systemReduced }),
    [enabled, systemReduced],
  );

  return (
    <MotionSettingsContext.Provider value={settings}>
      <MotionConfig reducedMotion="user">
        <div className="motion-root" data-motion={enabled ? "on" : "off"}>
          {children}
        </div>
      </MotionConfig>
    </MotionSettingsContext.Provider>
  );
}

export function useMotionSettings() {
  const settings = useContext(MotionSettingsContext);
  if (!settings) {
    throw new Error("useMotionSettings must be used inside MotionProvider.");
  }
  return settings;
}

interface FloatingPanelProps {
  children: ReactNode;
  className?: string;
  /** Seconds, with different delays keeping neighboring panels out of sync. */
  delay?: number;
  /** Vertical travel in pixels. */
  distance?: number;
  /** Duration of a full up-and-down cycle in seconds. */
  duration?: number;
}

type FloatingStyle = CSSProperties & {
  "--float-distance": string;
  "--float-duration": string;
  "--float-delay": string;
};

/** Individual translate preserves the wallet's existing CSS rotation and layout. */
export function FloatingPanel({
  children,
  className,
  delay = 0,
  distance = 7,
  duration = 7,
}: FloatingPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useMotionSettings();
  const inView = useInView(ref, { once: false, amount: 0.05 });
  const style: FloatingStyle = {
    "--float-distance": `${Math.max(0, distance)}px`,
    "--float-duration": `${Math.max(1, duration)}s`,
    "--float-delay": `${delay}s`,
  };

  return (
    <div
      ref={ref}
      className={[className, "qozmo-floating-panel"].filter(Boolean).join(" ")}
      data-floating-active={enabled && inView ? "true" : "false"}
      style={style}
    >
      {children}
    </div>
  );
}
