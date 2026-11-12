'use client';

import { useEffect, useState } from 'react';

/** Only update navigation appearance after scrolling beyond the initial page position. */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > threshold);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pageshow', schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return scrolled;
}
