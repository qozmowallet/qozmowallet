/**
 * Magic UI Animated Shiny Text — Copyright (c) Magic UI, MIT (see ./LICENSE).
 * Source: https://magicui.design/r/animated-shiny-text.json
 * Original gradient and keyframes retained; Tailwind translated to scoped CSS.
 */
import { type ComponentPropsWithoutRef, type CSSProperties } from "react";

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
  style,
  ...props
}: AnimatedShinyTextProps) {
  return (
    <span
      {...props}
      className={["mui-animated-shiny-text", className].filter(Boolean).join(" ")}
      style={{ "--shiny-width": `${shimmerWidth}px`, ...style } as CSSProperties}
    >
      {children}
    </span>
  );
}
