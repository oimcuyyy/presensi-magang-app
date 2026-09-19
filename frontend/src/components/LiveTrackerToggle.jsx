import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Navigation } from 'lucide-react';

const LiveTrackerToggle = ({ user }) => {
  const { isTracking, trackingError: error, toggleTracking } = useSocket();

  return (
    <div className="bg-white px-4 py-5 border border-gray-200 rounded-lg shadow-sm sm:p-6 mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isTracking ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
          <Navigation className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            Live Location
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            {isTracking ? 'Lokasi Anda sedang dibagikan secara real-time.' : 'Bagikan pergerakan lokasi Anda (seperti WA).'}
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
      
      <button
        onClick={() => toggleTracking(user)}
        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${isTracking ? 'bg-emerald-500' : 'bg-gray-200'}`}
        role="switch"
        aria-checked={isTracking}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isTracking ? 'translate-x-7' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
};

export default LiveTrackerToggle;
