import { useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';

/**
 * @param {Function} selector - A function that returns true if the message is relevant (e.g., msg => msg.type === 'response')
 * @param {Function} handler - The function to run when the selector returns true
 */
export const useSocketListener = (selector, handler) => {
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    // Define the callback that gets run on EVERY socket message
    const handleMessage = (message) => {
      // Only run the handler if the message passes the selector check
      if (selector(message)) {
        handler(message);
      }
    };

    // Subscribe to the global socket
    const unsubscribe = subscribe(handleMessage);

    // Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, [selector, handler, subscribe]);
};