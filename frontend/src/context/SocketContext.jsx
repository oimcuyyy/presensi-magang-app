import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);
  const [lastCoords, setLastCoords] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const newSocket = io(backendUrl || undefined, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 8000
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
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
      setCurrentAccuracy(null);
    } else {
      // Start tracking
      if (!navigator.geolocation) {
        setTrackingError('Geolocation tidak didukung pada perangkat ini.');
        return;
      }
      setTrackingError(null);

      // Helper function untuk emit lokasi berakurasi tinggi
      const sendLocation = (position) => {
        const accuracy = Math.round(position.coords.accuracy || 0);
        setCurrentAccuracy(accuracy);
        setLastCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        if (socket) {
          socket.emit('update_location', {
            userId: user.id,
            name: user.name,
            role: user.role,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: accuracy,
            speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : null, // km/h
            heading: position.coords.heading || null,
            timestamp: new Date().toISOString()
          });
        }
      };

      const handleGpsError = (err) => {
        let msg = 'Gagal mengakses GPS.';
        if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh browser/pengguna.';
        else if (err.code === 2) msg = 'Sinyal lokasi/GPS tidak terdeteksi. Aktifkan GPS HP.';
        else if (err.code === 3) msg = 'Waktu pencarian GPS habis (Timeout).';
        setTrackingError(msg);
      };

      // 1. Ambil posisi awal dengan akurasi tinggi
      navigator.geolocation.getCurrentPosition(
        sendLocation,
        handleGpsError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // 2. Pantau perpindahan real-time dengan akurasi tinggi dan interval rendah
      const id = navigator.geolocation.watchPosition(
        sendLocation,
        (err) => {
          handleGpsError(err);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 15000
        }
      );

      setWatchId(id);
      setIsTracking(true);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      connectionStatus,
      isTracking,
      trackingError,
      toggleTracking,
      currentAccuracy,
      lastCoords
    }}>
      {children}
    </SocketContext.Provider>
  );
};
