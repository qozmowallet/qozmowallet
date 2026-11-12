export function QozmoMark({ className = '' }: { className?: string }) {
  return (
    <img
      className={`qozmo-mark ${className}`}
      src="/brand/qozmo-stag-light.png"
      width={48}
      height={60}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
    />
  );
}

export function Brand({ className = '' }: { className?: string }) {
  return <a href="#home" className={`brand ${className}`} aria-label="Qozmo home"><QozmoMark/><span>qozmo<span className="brand-period">.</span></span></a>;
}

export function HandStar({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 52 58" fill="none" aria-hidden="true"><path d="M26 3c1.6 15.9 5 22.3 22 25-15.9 2.6-20.9 8.5-23 26C22.8 37.2 18 31.8 3 29 19.2 25.6 23.8 19.1 26 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg>;
}

export function ScribbleArrow({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 122 106" fill="none" aria-hidden="true"><path d="M114 16C86-2 72 26 88 31c13 4 5-29-20-23C36 14 42 52 46 77M46 77C36 51 24 36 9 24M46 77 10 65M22 15l8 13M2 84l25-1" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
