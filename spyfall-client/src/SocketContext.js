import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

// Create a context for the socket
const SocketContext = createContext(null);

// Custom hook to use the socket
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider component to wrap your app
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create a single socket instance
    const newSocket = io('http://localhost:4000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Socket event handlers
    const onConnect = () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    // Set up listeners
    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);

    // Clean up on unmount
    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.disconnect();
    };
  }, []);

  // Provide socket and connection status
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};