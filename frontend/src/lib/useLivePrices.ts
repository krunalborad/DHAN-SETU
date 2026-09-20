import { useEffect, useState } from "react";
import { subscribe } from "./priceEngine";

/**
 * Subscribes to the live price feed and returns a tick counter that
 * increments on every price update, so consuming components re-render
 * with fresh values from getLatestPrice()/getDayChangePct() without
 * needing to pass prices through props manually.
 */
export function useLivePrices() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return tick;
}
