import { useEffect, useState } from 'react';

/** Devuelve el valor despues de `delay` ms sin cambios. */
const useDebounce = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
