"use client";

/**
 * Magic UI Shimmer Button — Copyright (c) Magic UI, MIT (see ./LICENSE).
 * Source: https://magicui.design/r/shimmer-button.json
 * Original spark layers and keyframes retained; Tailwind translated to mui-* CSS.
 */
import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({
    shimmerColor = "#ffffff",
    shimmerSize = "0.05em",
    shimmerDuration = "3s",
    borderRadius = "100px",
    background = "rgba(0, 0, 0, 1)",
    className,
    children,
    style,
    type = "button",
    ...props
  }, ref) => (
    <button
      {...props}
      ref={ref}
      type={type}
      style={{
        "--spread": "90deg",
        "--shimmer-color": shimmerColor,
        "--radius": borderRadius,
        "--speed": shimmerDuration,
        "--cut": shimmerSize,
        "--bg": background,
        ...style,
      } as CSSProperties}
      className={["mui-shimmer-button", className].filter(Boolean).join(" ")}
    >
      <span className="mui-shimmer-spark-container" aria-hidden="true">
        <span className="mui-shimmer-spark">
          <span className="mui-shimmer-spark-light" />
        </span>
      </span>
      {children}
      <span className="mui-shimmer-highlight" aria-hidden="true" />
      <span className="mui-shimmer-backdrop" aria-hidden="true" />
    </button>
  )
);

ShimmerButton.displayName = "ShimmerButton";
