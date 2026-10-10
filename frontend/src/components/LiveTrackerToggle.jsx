import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Navigation, AlertCircle, Signal } from 'lucide-react';

const LiveTrackerToggle = ({ user }) => {
  const { isTracking, trackingError: error, toggleTracking, currentAccuracy } = useSocket();

  const getAccuracyBadge = (acc) => {
    if (!acc) return null;
    if (acc <= 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Signal className="w-3 h-3 text-emerald-600" /> Akurat (&plusmn;{acc}m)
        </span>
      );
    }
    if (acc <= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          <Signal className="w-3 h-3 text-amber-600" /> Cukup (&plusmn;{acc}m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
        <AlertCircle className="w-3 h-3 text-red-600" /> Lemah (&plusmn;{acc}m)
      </span>
    );
  };

  return (
    <div className="bg-white px-5 py-4 border border-slate-200/90 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
      <div className="flex items-center gap-3.5">
        <div
          className={`p-2.5 rounded-xl transition-colors ${
            isTracking ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Pelacakan Telemetri GPS Satelit
            </h3>
            {isTracking && getAccuracyBadge(currentAccuracy)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTracking
              ? 'Posisi keberadaan siswa sedang disiarkan secara real-time ke guru pembimbing.'
              : 'Aktifkan agar guru pembimbing dapat memverifikasi keberadaan siswa di lokasi PKL.'}
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end sm:justify-start">
        <button
          type="button"
          onClick={() => toggleTracking(user)}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
            isTracking ? 'bg-emerald-600' : 'bg-slate-200'
          }`}
          role="switch"
          aria-checked={isTracking}
          title={isTracking ? 'Matikan pelacakan GPS' : 'Aktifkan pelacakan GPS'}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isTracking ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default LiveTrackerToggle;
