import { useEffect, useState } from "react";

// Returns a copy of `value` that only updates `delay` ms after the last
// change — used to defer expensive filtering (or API calls) until the user
// stops typing, without slowing down the input itself.
export function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
