/**
 * Custom hook for using the Screen Wake Lock API
 * @returns {Object} Object containing functions and state for wake lock
 */
export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState(null);
  const [error, setError] = useState(null);

  // Function to request a wake lock
  const acquireWakeLock = async () => {
    if (wakeLock) {
      if (wakeLock.released) {
        setWakeLock(null);
      } else {
        return true;
      }
    }
    try {
      // Check if the Screen Wake Lock API is supported
      if ('wakeLock' in navigator) {
        // Clear any existing errors
        setError(null);
        
        // Request a screen wake lock
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        
        return true;
      } else {
        setError(new Error('Screen Wake Lock API not supported'));
        return false;
      }
    } catch (err) {
      setError(err);
      return false;
    }
  };

  // Function to release the wake lock
  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release()
        .then(() => {
          setWakeLock(null);
        })
        .catch((err) => {
          setError(err);
        });
    }
  };

  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Re-acquire the wake lock when the page becomes visible again
        await acquireWakeLock();
      }
    };

    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Release the wake lock when unmounting
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, [wakeLock]); // Re-run effect when wakeLock changes

  return {
    acquireWakeLock,
    releaseWakeLock,
    error
  };
}

/**
 * Custom hook that works like useState but persists the state to localStorage
 * @param {string} key - The key to store the value under in localStorage
 * @param {any} initialValue - The initial value if no value exists in localStorage
 * @returns {Array} A stateful value and a function to update it (like useState)
 */
export function useLocalStorage(key, initialValue) {
  // Create state based on value from localStorage or initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // Log errors
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Import from preact/hooks
import { useState, useEffect } from 'preact/hooks';
