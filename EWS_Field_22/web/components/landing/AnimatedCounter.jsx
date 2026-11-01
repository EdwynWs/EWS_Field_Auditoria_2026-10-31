"use client";
import { useEffect, useRef, useState } from "react";
export default function AnimatedCounter({ value }) {
  const ref = useRef(null),
    [number, setNumber] = useState(value);
  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      function tick(now) {
        const f = Math.min(1, (now - start) / 900);
        setNumber(Math.round(value * (1 - Math.pow(1 - f, 3))));
        if (f < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    });
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return (
    <span
      ref={ref}
      className="ef5-counter"
      role="img"
      aria-label={String(value).padStart(2, "0")}
    >
      <span aria-hidden="true">{String(number).padStart(2, "0")}</span>
    </span>
  );
}
