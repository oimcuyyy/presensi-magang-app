import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

const WebcamCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Kamera tidak dapat diakses. Pastikan Anda telah memberikan izin.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line
  }, []);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(dataUrl);
      onCapture(dataUrl);
      
      // Matikan kamera setelah ambil foto
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [stream, onCapture]);

  const retake = () => {
    setPhoto(null);
    onCapture(null);
    startCamera();
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative rounded-lg overflow-hidden bg-gray-900 shadow-inner max-w-sm w-full aspect-[3/4] md:aspect-video flex items-center justify-center">
        {!photo ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={capture}
                className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-4 shadow-lg backdrop-blur-sm transition-transform active:scale-95 flex items-center justify-center"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <>
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={retake}
                className="bg-gray-900/80 hover:bg-gray-900 text-white rounded-full px-4 py-2 shadow-lg backdrop-blur-sm transition-transform active:scale-95 flex items-center gap-2 text-sm font-medium border border-gray-700"
              >
                <RefreshCw className="w-4 h-4" /> Ulangi Foto
              </button>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {!photo && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Pastikan wajah Anda dan lokasi magang terlihat jelas
        </p>
      )}
    </div>
  );
};

export default WebcamCapture;
