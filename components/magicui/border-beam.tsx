"use client";

/**
 * Magic UI Border Beam — Copyright (c) Magic UI, MIT (see ./LICENSE).
 * Source: https://magicui.design/r/border-beam.json
 * Original Motion offset-path animation retained; scoped CSS, compatible border masks,
 * viewport gating, and motion opt-out added.
 */
import { useRef, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion, type MotionStyle, type Transition } from "motion/react";

export interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  transition?: Transition;
  className?: string;
  style?: CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderWidth?: number;
  disabled?: boolean;
}

export function BorderBeam(props: BorderBeamProps) {
  const reducedMotion = useReducedMotion();
  if (props.disabled || reducedMotion) return null;

  // Mount the observer with its element when animation is enabled.
  return <VisibleBorderBeam {...props} />;
}

function VisibleBorderBeam({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}: BorderBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);

  return (
    <div
      ref={ref}
      className="mui-border-beam"
      aria-hidden="true"
      style={{ "--border-beam-width": `${borderWidth}px` } as CSSProperties}
    >
      <motion.div
        className={["mui-border-beam-light", className].filter(Boolean).join(" ")}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          ...style,
        } as MotionStyle}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={isInView ? {
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`],
        } : { offsetDistance: `${initialOffset}%` }}
        transition={isInView
          ? { repeat: Infinity, ease: "linear", duration, delay: -delay, ...transition }
          : { duration: 0, repeat: 0 }}
      />
    </div>
  );
}
