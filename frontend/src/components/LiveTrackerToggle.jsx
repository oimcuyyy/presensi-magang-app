import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Navigation, AlertCircle, Signal } from 'lucide-react';

/**
 * LiveTrackerToggle - Berbagi lokasi ke guru pembimbing
 * Menggunakan bahasa manusiawi yang menjelaskan privasi siswa dengan jujur.
 */
const LiveTrackerToggle = ({ user }) => {
  const { isTracking, trackingError: error, toggleTracking, currentAccuracy } = useSocket();

  const getAccuracyBadge = (acc) => {
    if (!acc) return null;
    if (acc <= 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Signal className="w-3 h-3 text-emerald-600" /> Sinyal Bagus (&plusmn;{acc}m)
        </span>
      );
    }
    if (acc <= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Signal className="w-3 h-3 text-amber-600" /> Cukup (&plusmn;{acc}m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-200">
        <AlertCircle className="w-3 h-3 text-red-600" /> Sinyal Lemah (&plusmn;{acc}m)
      </span>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-5 border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
      <div className="flex items-start sm:items-center gap-3.5">
        <div
          className={`p-2.5 rounded-xl transition-colors shrink-0 mt-0.5 sm:mt-0 ${
            isTracking ? 'bg-[#0c2340] text-amber-400 shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <Navigation className={`w-5 h-5 ${isTracking ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900">
              Bagikan Lokasi ke Guru
            </h2>
            {isTracking && getAccuracyBadge(currentAccuracy)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {isTracking
              ? 'Lokasimu aktif dibagikan ke guru pembimbing selama jam PKL.'
              : 'Nyalakan agar guru pembimbing bisa memantau kehadiranmu di lokasi PKL.'}
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end sm:justify-start shrink-0">
        <button
          type="button"
          onClick={() => toggleTracking(user)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-[#0c2340] ${
            isTracking ? 'bg-[#0c2340]' : 'bg-slate-300'
          }`}
          role="switch"
          aria-checked={isTracking}
          aria-label={isTracking ? 'Matikan berbagi lokasi' : 'Nyalakan berbagi lokasi'}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
              isTracking ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default LiveTrackerToggle;
