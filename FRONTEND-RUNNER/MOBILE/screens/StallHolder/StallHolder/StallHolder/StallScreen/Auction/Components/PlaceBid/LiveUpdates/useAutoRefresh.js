import { useEffect, useRef, useState, useCallback } from "react";
import { AuctionTimings } from "../../shared/constants";

const useAutoRefresh = ({
  refreshFunction,
  interval = AuctionTimings.AUTO_REFRESH_INTERVAL,
  enabled = true,
  dependencies = [],
  onError = null,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isRefreshing || !refreshFunction) return;

    setIsRefreshing(true);
    setError(null);

    try {
      await refreshFunction();
      if (mountedRef.current) {
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error("Auto-refresh error:", err);
      if (mountedRef.current) {
        setError(err);
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [refreshFunction, isRefreshing, onError]);

  // Auto-refresh effect
  useEffect(() => {
    if (!enabled || !refreshFunction) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start auto-refresh
    intervalRef.current = setInterval(() => {
      if (mountedRef.current && !isRefreshing) {
        refresh();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    enabled,
    refreshFunction,
    interval,
    isRefreshing,
    refresh,
    ...dependencies,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRefreshing,
    lastUpdated,
    error,
    refresh,
  };
};

export default useAutoRefresh;
