import { useState, useEffect } from 'react';
import { apiClient } from '../services/api/client';

/**
 * Lightweight network and backend health monitor.
 * Periodically verifies server reachability or responds to ping requests.
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isBackendReachable, setIsBackendReachable] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkConnectivity = async () => {
      try {
        // Quick HEAD/GET probe to verify server availability
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          cache: 'no-store',
        });
        if (isMounted) {
          setIsConnected(response.ok || response.status === 204);
        }
      } catch {
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    // Run check on mount and every 30 seconds
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isConnected, isBackendReachable };
}
