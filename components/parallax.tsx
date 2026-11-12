"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type AriaAttributes,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useMotionSettings } from "./motion-system";

const DESKTOP_QUERY = "(min-width: 761px) and (hover: hover) and (pointer: fine)";
const CONTROL_SELECTOR = "button,a,input,select,textarea,[role='button'],[tabindex]:not([tabindex='-1']),[contenteditable='true']";
const clamp = (value: number) => Math.max(-1, Math.min(1, value));

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia?.(DESKTOP_QUERY).matches;
}

const getServerDesktopSnapshot = () => false;

interface ParallaxSettings {
  active: boolean;
  desktop: boolean;
  phase: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}

const ParallaxContext = createContext<ParallaxSettings | null>(null);

interface ParallaxSceneProps extends Pick<AriaAttributes, "aria-label" | "aria-labelledby"> {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "div" | "section";
  pointer?: boolean;
}

/** Measure a stationary scene; all moving layers share its smoothed scroll value. */
export function ParallaxScene({
  children,
  className,
  id,
  as: Tag = "div",
  pointer = false,
  ...aria
}: ParallaxSceneProps) {
  const ref = useRef<HTMLElement | null>(null);
  const setRef = useCallback((element: HTMLElement | null) => { ref.current = element; }, []);
  const focusLocked = useRef(false);
  const { enabled } = useMotionSettings();
  const desktop = useSyncExternalStore(subscribeToDesktop, getDesktopSnapshot, getServerDesktopSnapshot);
  const [mounted, setMounted] = useState(false);
  const active = enabled && mounted;
  const pointerEnabled = active && desktop && pointer;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const progress = useSpring(scrollYProgress, {
    stiffness: 130, damping: 32, mass: 0.7, restDelta: 0.0001, skipInitialAnimation: true,
  });
  const phase = useTransform(progress, [0, 1], [-1, 1]);
  const pointerX = useSpring(0, { stiffness: 120, damping: 26, mass: 0.6 });
  const pointerY = useSpring(0, { stiffness: 120, damping: 26, mass: 0.6 });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!pointerEnabled) {
      pointerX.jump(0);
      pointerY.jump(0);
      focusLocked.current = false;
    }
  }, [pointerEnabled, pointerX, pointerY]);

  // Stop the current spring as soon as a control is targeted, so it stays put.
  const freezePointer = () => {
    pointerX.jump(pointerX.get());
    pointerY.jump(pointerY.get());
  };
  const resetPointer = () => {
    if (focusLocked.current) return;
    pointerX.set(0);
    pointerY.set(0);
  };
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!pointerEnabled || event.pointerType !== "mouse" || focusLocked.current) return;
    const target = event.target instanceof Element ? event.target : null;
    if (event.buttons || target?.closest(CONTROL_SELECTOR)) {
      freezePointer();
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(clamp(((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1));
    pointerY.set(clamp(((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1));
  };
  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.closest(CONTROL_SELECTOR)) {
      focusLocked.current = true;
      freezePointer();
    }
  };
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    focusLocked.current = next instanceof Element
      && event.currentTarget.contains(next)
      && !!next.closest(CONTROL_SELECTOR);
    if (!focusLocked.current) resetPointer();
  };
  const settings = useMemo(
    () => ({ active, desktop, phase, pointerX, pointerY }),
    [active, desktop, phase, pointerX, pointerY],
  );

  return (
    <ParallaxContext.Provider value={settings}>
      <Tag
        ref={setRef}
        id={id}
        className={["qozmo-parallax-scene", className].filter(Boolean).join(" ")}
        style={{ position: "relative" }}
        onPointerMove={pointerEnabled ? handlePointerMove : undefined}
        onPointerLeave={pointerEnabled ? resetPointer : undefined}
        onPointerDownCapture={pointerEnabled ? freezePointer : undefined}
        onFocusCapture={pointerEnabled ? handleFocus : undefined}
        onBlurCapture={pointerEnabled ? handleBlur : undefined}
        {...aria}
      >
        {children}
      </Tag>
    </ParallaxContext.Provider>
  );
}

interface ParallaxLayerProps extends Pick<AriaAttributes, "aria-hidden" | "aria-label"> {
  children?: ReactNode;
  className?: string;
  as?: "div" | "span";
  /** Signed travel from -y to +y as the scene crosses the viewport. */
  y?: number;
  x?: number;
  rotate?: number;
  /** Pointer displacement in pixels; disabled for touch and narrow screens. */
  pointerDepth?: number;
  mobileScale?: number;
}

/** Keep base CSS rotations and floating motion on the child, not this wrapper. */
export function ParallaxLayer({
  children,
  className,
  as = "div",
  y = 0,
  x = 0,
  rotate = 0,
  pointerDepth = 0,
  mobileScale = 0.2,
  ...aria
}: ParallaxLayerProps) {
  const settings = useContext(ParallaxContext);
  if (!settings) throw new Error("ParallaxLayer must be used inside ParallaxScene.");
  const { active, desktop, phase, pointerX, pointerY } = settings;
  const scale = desktop ? 1 : Math.max(0, Math.min(1, mobileScale));
  const translateX = useTransform(() => desktop
    ? clamp(phase.get()) * x + clamp(pointerX.get()) * pointerDepth
    : 0);
  const translateY = useTransform(() => clamp(phase.get()) * y * scale
    + (desktop ? clamp(pointerY.get()) * pointerDepth : 0));
  const rotation = useTransform(() => desktop ? clamp(phase.get()) * rotate : 0);
  const Tag = as === "span" ? motion.span : motion.div;

  return (
    <Tag
      className={["qozmo-parallax-layer", className].filter(Boolean).join(" ")}
      data-parallax-state={active ? "active" : "paused"}
      style={{
        x: active ? translateX : 0,
        y: active ? translateY : 0,
        rotate: active ? rotation : 0,
      }}
      {...aria}
    >
      {children}
    </Tag>
  );
}
