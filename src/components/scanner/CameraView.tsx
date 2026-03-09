import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/i18n/LanguageContext';

interface CameraViewProps {
  onCapture: (imageSrc: string) => void;
  processing?: boolean;
}

export function CameraView({ onCapture, processing = false }: CameraViewProps) {
  const { t } = useTranslation();
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [freezeFrame, setFreezeFrame] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Show freeze-frame briefly for visual feedback
      setFreezeFrame(imageSrc);
      setTimeout(() => setFreezeFrame(null), 300);
      onCapture(imageSrc);
    }
  }, [onCapture]);

  return (
    <div className="relative flex flex-col items-center gap-4">
      {cameraError ? (
        <div className="w-full max-w-md bg-red-900/20 border border-red-700/30 rounded-xl p-6 text-center">
          <Camera size={48} className="mx-auto mb-3 text-red-400 opacity-50" />
          <p className="text-red-300 font-medium">Camera not available</p>
          <p className="text-gray-400 text-sm mt-2">{cameraError}</p>
        </div>
      ) : (
        <div className="relative w-full max-w-md overflow-hidden rounded-xl border-2 border-accent/50 bg-black">
          {/* Freeze frame overlay */}
          {freezeFrame && (
            <img
              src={freezeFrame}
              alt=""
              className="absolute inset-0 w-full h-full object-cover z-10 animate-pulse"
            />
          )}

          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.95}
            videoConstraints={{
              facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1440 },
            }}
            onUserMediaError={(err) => setCameraError(String(err))}
            className="w-full"
          />

          {/* Scan overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Name region highlight band - top 15-20% */}
            <div className="absolute top-[8%] left-4 right-4 h-[14%] border border-accent/40 rounded-lg bg-accent/5" />
            <div className="absolute top-[5%] left-0 right-0 text-center">
              <span className="text-[10px] text-accent/70 bg-black/50 px-2 py-0.5 rounded">
                {t('scanner.pointCamera')}
              </span>
            </div>

            {/* Corner guides */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-accent rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-accent rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-accent rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-accent rounded-br-lg" />

            {/* Scan line */}
            {!processing && !freezeFrame && (
              <div className="absolute left-8 right-8 h-0.5 bg-accent/70 scan-line" />
            )}

            {/* Processing overlay */}
            {processing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Spinner size="lg" className="mx-auto mb-3" />
                  <p className="text-white text-sm">{t('scanner.reading')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setFacingMode((m) => m === 'environment' ? 'user' : 'environment')}
          className="p-3 rounded-full bg-card-border text-gray-300 hover:text-white transition-colors"
          title="Flip camera"
        >
          <RefreshCw size={20} />
        </button>

        <button
          onClick={capture}
          disabled={processing || !!cameraError}
          className={clsx(
            'w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all',
            processing || cameraError
              ? 'bg-gray-700 border-gray-500 cursor-not-allowed'
              : 'bg-accent hover:bg-accent-hover active:scale-95',
          )}
          title="Capture card"
        >
          <Camera size={24} className="text-white" />
        </button>

        <div className="w-12" />
      </div>
    </div>
  );
}
