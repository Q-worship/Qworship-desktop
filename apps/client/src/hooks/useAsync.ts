import { useState, useCallback } from 'react';

/**
 * Generic hook for handling async API calls with loading/error states.
 */
export function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async () => {
      setStatus('pending');
      setValue(null);
      setError(null);
      return asyncFunction()
        .then((response) => {
          setValue(response);
          setStatus('success');
          return response;
        })
        .catch((err) => {
          setError(err);
          setStatus('error');
          throw err;
        });
    },
    [asyncFunction]
  );

  return { execute, status, value, error, isLoading: status === 'pending' };
}
