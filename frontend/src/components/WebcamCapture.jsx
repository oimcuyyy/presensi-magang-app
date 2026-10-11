import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

const WebcamCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 }
        },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Kamera tidak dapat diakses. Mohon izinkan akses kamera di browser Anda.');
      setIsReady(false);
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();

    const handleVisibility = () => {
      if (document.hidden) {
        stopStream();
      } else if (!photo) {
        startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopStream();
    };
  }, [startCamera, stopStream, photo]);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhoto(dataUrl);
      onCapture(dataUrl);

      // Pastikan stream kamera dimatikan segera setelah foto diambil
      stopStream();
    }
  }, [onCapture, stopStream]);

  const retake = () => {
    setPhoto(null);
    onCapture(null);
    startCamera();
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800">Izin Kamera Diperlukan</p>
          <p className="mt-1 text-xs text-red-700 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={startCamera}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 max-w-sm w-full aspect-[3/4] flex items-center justify-center shadow-lg">
        {!photo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Panduan Oval Wajah untuk Foto Selfie Absensi */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="w-48 h-64 border-2 border-dashed border-white/60 rounded-[50%] shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />
              <p className="mt-4 text-xs font-medium text-white/90 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                Posisikan wajah di dalam garis
              </p>
            </div>

            {/* Tombol Ambil Foto */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
              <button
                type="button"
                onClick={capture}
                disabled={!isReady}
                aria-label="Ambil foto selfie"
                className="w-16 h-16 bg-white hover:bg-slate-100 active:scale-95 text-slate-900 rounded-full shadow-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-900" />
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <img src={photo} alt="Hasil foto selfie" className="w-full h-full object-cover" />
            <div className="absolute bottom-5 left-0 right-0 flex justify-center z-10">
              <button
                type="button"
                onClick={retake}
                className="bg-slate-900/90 hover:bg-slate-900 text-white rounded-full px-5 py-2.5 shadow-xl backdrop-blur-md transition-transform active:scale-95 flex items-center gap-2 text-sm font-semibold border border-white/20"
              >
                <RefreshCw className="w-4 h-4" /> Ulangi Foto
              </button>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {!photo && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          Pastikan wajah dan lingkungan magang terlihat terang dan jelas.
        </p>
      )}
    </div>
  );
};

export default WebcamCapture;
