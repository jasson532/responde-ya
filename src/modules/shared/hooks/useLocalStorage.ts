import { useCallback, useState } from 'react';
import localStore from 'modules/shared/services/storage/localStore';

/** Estado sincronizado con localStorage, tolerante a fallos de escritura. */
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => localStore.read<T>(key, initialValue));

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === 'function' ? (next as (c: T) => T)(current) : next;
        localStore.write(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    localStore.remove(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return { value, update, reset } as const;
};

export default useLocalStorage;
