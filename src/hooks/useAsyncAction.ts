/**
 * useAsyncAction — Generic wrapper that adds loading/error state to any async function.
 *
 * Eliminates boilerplate: setIsLoading → try/catch → setIsLoading(false).
 *
 * Usage:
 *   const { execute, isLoading, error, lastResult } = useAsyncAction(myAsyncFn);
 *   const result = await execute(arg1, arg2);
 */

"use client";

import { useState, useCallback, useRef } from "react";

export interface AsyncActionState<T> {
  /** Execute the wrapped function with arguments */
  execute: (...args: Parameters<(...a: never[]) => Promise<T>>) => Promise<T | undefined>;
  /** Whether the action is currently running */
  isLoading: boolean;
  /** Error message from the last failed call, or null */
  error: string | null;
  /** Result from the last successful call */
  lastResult: T | null;
  /** Reset error and lastResult */
  reset: () => void;
}

/**
 * Wrap an async function with reactive loading/error/result state.
 *
 * @param fn The async function to wrap
 * @param onSuccess Optional callback invoked with the result on success
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  onSuccess?: (result: TResult) => void,
): {
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  isLoading: boolean;
  error: string | null;
  lastResult: TResult | null;
  reset: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TResult | null>(null);
  const isMounted = useRef(true);

  // Keep fn reference stable without re-creating execute on every render
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const execute = useCallback(async (...args: TArgs) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...args);
      if (isMounted.current) {
        setLastResult(result);
        onSuccessRef.current?.(result);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (isMounted.current) setError(msg);
      return undefined;
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLastResult(null);
  }, []);

  return { execute, isLoading, error, lastResult, reset };
}
