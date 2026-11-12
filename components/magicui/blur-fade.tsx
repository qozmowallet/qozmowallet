"use client";

/**
 * Magic UI Blur Fade — Copyright (c) Magic UI, MIT (see ./LICENSE).
 * Source: https://magicui.design/r/blur-fade.json
 * Adapted to scoped CSS; adds Qozmo's yOffset alias and motion preferences.
 */
import { useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type UseInViewOptions,
  type Variants,
} from "motion/react";

export interface BlurFadeProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: Variants;
  duration?: number;
  delay?: number;
  yOffset?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  blur?: string;
  disabled?: boolean;
}

const getFilter = (value: Variants[string]) =>
  typeof value === "function" ? undefined : value.filter;

export function BlurFade({
  children,
  className,
  variant,
  duration = 0.55,
  delay = 0,
  yOffset = 12,
  offset = yOffset,
  direction = "up",
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
  disabled = false,
  ...props
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const reducedMotion = useReducedMotion();
  const isStatic = disabled || Boolean(reducedMotion);
  const isInView = !inView || inViewResult;
  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const defaultVariants: Variants = {
    hidden: {
      [axis]: direction === "right" || direction === "down" ? -offset : offset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: { [axis]: 0, opacity: 1, filter: "blur(0px)" },
  };
  const combinedVariants = variant ?? defaultVariants;
  const hiddenFilter = getFilter(combinedVariants.hidden);
  const visibleFilter = getFilter(combinedVariants.visible);
  const shouldTransitionFilter =
    hiddenFilter != null && visibleFilter != null && hiddenFilter !== visibleFilter;

  return (
    <AnimatePresence>
      <motion.div
        {...props}
        ref={ref}
        initial={isStatic ? false : "hidden"}
        animate={isStatic ? { opacity: 1, x: 0, y: 0, filter: "none" } : isInView ? "visible" : "hidden"}
        exit={isStatic ? undefined : "hidden"}
        variants={combinedVariants}
        transition={isStatic ? { duration: 0, delay: 0 } : {
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
          ...(shouldTransitionFilter ? { filter: { duration } } : {}),
        }}
        className={["mui-blur-fade", className].filter(Boolean).join(" ")}
        data-motion-static={isStatic || undefined}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
