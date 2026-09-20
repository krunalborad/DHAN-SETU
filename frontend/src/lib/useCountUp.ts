import { useEffect, useRef, useState } from "react";

/**
 * Animates a formatted numeric string (e.g. "₹15,62,200.21", "+249.13%",
 * "53/100") by extracting the first number in it, counting up from its
 * previous value, and re-inserting it into the original prefix/suffix —
 * so the component using it never has to change its value-formatting logic.
 *
 * Falls back to just returning `value` unchanged if no number is found.
 */
export function useCountUp(value: string, durationMs = 600) {
  const [display, setDisplay] = useState(value);
  const prevNumRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const match = value.match(/-?[\d,]+(\.\d+)?/);
    if (!match) {
      setDisplay(value);
      return;
    }

    const raw = match[0];
    const target = parseFloat(raw.replace(/,/g, ""));
    const from = prevNumRef.current ?? target;
    const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
    const prefix = value.slice(0, match.index);
    const suffix = value.slice((match.index ?? 0) + raw.length);
    const useGrouping = raw.includes(",");

    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const current = from + (target - from) * eased;
      const formatted = current.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping,
      });
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevNumRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}