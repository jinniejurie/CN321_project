import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

// สร้าง context สำหรับ socket
const SocketContext = createContext(null);

// Custom hook เพื่อใช้ socket ในคอมโพเนนต์อื่นๆ
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider component สำหรับครอบ app
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("Initializing socket connection...");
    
    // สร้างการเชื่อมต่อเดียว
    const newSocket = io('http://localhost:4000', {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    setSocket(newSocket);

    // Event handlers
    const onConnect = () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
      
      // พยายามเข้าร่วมห้องใหม่หากมีข้อมูลใน localStorage
      const storedRoomCode = localStorage.getItem("roomCode");
      const storedPlayerName = localStorage.getItem("playerName");
      
      if (storedRoomCode && storedPlayerName) {
        console.log("Attempting to rejoin room:", storedRoomCode);
        newSocket.emit("joinRoom", { 
          roomCode: storedRoomCode, 
          playerName: storedPlayerName 
        });
      }
    };

    const onDisconnect = (reason) => {
      console.log('Disconnected from server. Reason:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    };

    // ลงทะเบียน event listeners
    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);

    // ทำความสะอาดเมื่อคอมโพเนนต์ถูกยกเลิก
    return () => {
      console.log("Cleaning up socket connection...");
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onConnectError);
      newSocket.disconnect();
    };
  }, []);

  console.log("Socket connection status:", isConnected);

  // ส่ง socket และสถานะการเชื่อมต่อให้กับคอมโพเนนต์ลูก
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};