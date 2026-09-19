import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [trackingError, setTrackingError] = useState(null);

  useEffect(() => {
    const newSocket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const toggleTracking = (user) => {
    if (isTracking) {
      // Stop tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      if (socket) {
        socket.emit('stop_sharing');
      }
      setIsTracking(false);
      setTrackingError(null);
    } else {
      // Start tracking
      if (!navigator.geolocation) {
        setTrackingError('Geolocation tidak didukung browser ini.');
        return;
      }
      setTrackingError(null);
      
      // Helper function untuk emit
      const sendLocation = (position) => {
        socket.emit('update_location', {
          userId: user.id,
          name: user.name,
          role: user.role,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString()
        });
      };

      // Tembak lokasi sekarang juga (sekali)
      navigator.geolocation.getCurrentPosition(
        sendLocation,
        (err) => console.log('getCurrentPosition err:', err),
        { enableHighAccuracy: false, timeout: 5000 }
      );
      
      // Pantau pergerakan selanjutnya
      const id = navigator.geolocation.watchPosition(
        sendLocation,
        (err) => {
          setTrackingError(`Gagal melacak: ${err.message}`);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
      
      setWatchId(id);
      setIsTracking(true);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isTracking, trackingError, toggleTracking }}>
      {children}
    </SocketContext.Provider>
  );
};
