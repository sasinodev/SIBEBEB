import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Scan,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import { Avatar3D } from './Avatar3D';
import { globalAudioSystem } from '../utils/audioSystem';
import type { AvatarEmotion, AvatarGesture, SibebebConfig, ChatMessage } from '../types';

interface FullScreenVisionModeProps {
  isOpen: boolean;
  onClose: () => void;
  config: SibebebConfig;
  onSpeak: (text: string) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  avatarEmotion: AvatarEmotion;
  avatarGesture: AvatarGesture;
  isSpeaking: boolean;
  audioVolume: number;
  setAvatarEmotion: (emo: AvatarEmotion) => void;
  setAvatarGesture: (ges: AvatarGesture) => void;
}

export const FullScreenVisionMode: React.FC<FullScreenVisionModeProps> = ({
  isOpen,
  onClose,
  config,
  onSpeak,
  onSendMessage,
  avatarEmotion,
  avatarGesture,
  isSpeaking,
  audioVolume,
  setAvatarEmotion,
  setAvatarGesture,
}) => {
  if (!isOpen) return null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScanning, setIsScanning] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [lastDetectedObject, setLastDetectedObject] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<string>('Halo kak! SIBEBEB lagi ngeliat kamu lewat kamera nih! Tunjukkin barang apa aja ya!');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Camera & Microphone automatically on fullscreen activation
  useEffect(() => {
    let isMounted = true;

    async function activateDevices() {
      try {
        setCameraError(null);
        // Request both camera and audio
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        setMicActive(true);

        // Start listening via Speech Recognition
        startListeningLoop();

        // Initial scan greeting after camera warmup
        setTimeout(() => {
          if (isMounted) captureAndAnalyze();
        }, 1800);
      } catch (err: any) {
        console.warn('Failed to access camera/mic:', err);
        setCameraError(err?.message || 'Izin kamera / mikrofon ditolak.');
        // Fallback: try just camera without audio constraint
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
          });
          if (isMounted) {
            streamRef.current = videoStream;
            if (videoRef.current) videoRef.current.srcObject = videoStream;
            setCameraActive(true);
          }
        } catch (e2) {}
      }
    }

    activateDevices();

    // Auto-scan interval (every 8 seconds if auto-scan is on)
    const scanInterval = setInterval(() => {
      if (autoScanEnabled && !isScanning && !isSpeaking) {
        captureAndAnalyze();
      }
    }, 8500);

    return () => {
      isMounted = false;
      clearInterval(scanInterval);
      stopDevices();
    };
  }, [facingMode]);

  // Stop media devices
  const stopDevices = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setMicActive(false);
  };

  // Continuous speech listening loop
  const startListeningLoop = () => {
    const recognizer = globalAudioSystem.initSpeechRecognition(
      config.language,
      (transcript, isFinal) => {
        setUserTranscript(transcript);
        if (isFinal) {
          // Send user speech to SIBEBEB with camera vision context
          captureAndAnalyze(transcript);
        }
      },
      (err) => {
        console.warn('Speech recognition error in fullscreen:', err);
      }
    );
    recognizer.start();
  };

  // Capture current video frame and send to vision AI
  const captureAndAnalyze = async (userPromptText?: string) => {
    if (!videoRef.current || isScanning) return;

    try {
      setIsScanning(true);
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 480, 360);
      const base64Jpg = canvas.toDataURL('image/jpeg', 0.8);

      const res = await fetch('/api/vision-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Jpg,
          userMessage: userPromptText || userTranscript || '',
          config,
        }),
      });

      const data = await res.json();

      if (data.detectedObject) {
        setLastDetectedObject(data.detectedObject);
      }

      if (data.expression) setAvatarEmotion(data.expression);
      if (data.gesture) setAvatarGesture(data.gesture);

      if (data.reply) {
        setSubtitles(data.reply);
        setUserTranscript('');
        await onSpeak(data.reply);
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    stopDevices();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#05070e] text-white select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Hidden offscreen canvas for snapshot capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP HEADER: Clean Status Bar & Exit Button */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* SIBEBEB Fullscreen Live Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-amber-500/40 text-xs font-bold shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-amber-300">Fullscreen Live</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 text-[11px]">Kamera & Mic Aktif</span>
          </div>

          {/* Detected Object Tag Badge */}
          {lastDetectedObject && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-bold animate-in fade-in duration-300 shadow-lg">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Melihat: {lastDetectedObject}</span>
            </div>
          )}
        </div>

        {/* Exit Fullscreen Button */}
        <button
          onClick={() => {
            stopDevices();
            onClose();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-extrabold text-xs shadow-xl transition-all active:scale-95"
          title="Keluar dari Full Screen"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* CENTER VIEWPORT: The Character in Massive Immersive Glory */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Fullscreen Avatar Stage */}
        <div className="w-full h-full">
          <Avatar3D
            emotion={avatarEmotion}
            gesture={avatarGesture}
            isSpeaking={isSpeaking}
            audioVolume={audioVolume}
            theme={config.backgroundTheme}
            customAvatarImage={config.customAvatarImage}
            onCheekSquish={() => {
              setAvatarEmotion('squish_cheek');
              onSpeak('Aduh kak, pipiku dicubit lagi! Gemoy banget deh!');
            }}
            onPoseChange={(p) => setAvatarGesture(p)}
          />
        </div>

        {/* COMPACT FLOATING DEVICE CAMERA HUD (Pinned comfortably at Top-Right below header) */}
        <div className="absolute top-14 right-3 sm:right-5 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden bg-black/90 border-2 border-amber-400/60 shadow-2xl z-20 group">
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />

          {/* Scanner Crosshair Overlay */}
          <div className="absolute inset-0 pointer-events-none border border-amber-400/30 m-1.5 rounded-xl flex flex-col justify-between p-1.5">
            <div className="flex justify-between items-center text-[9px] text-amber-400 font-mono font-bold">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
              </span>
              <span>VISION</span>
            </div>

            {isScanning && (
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce" />
            )}

            <div className="text-[8px] text-amber-300 font-mono text-center bg-black/70 py-0.5 rounded">
              {isScanning ? 'Menganalisis...' : 'Deteksi Aktif'}
            </div>
          </div>

          {/* Camera flip button */}
          <button
            onClick={toggleFacingMode}
            className="absolute bottom-1.5 right-1.5 p-1 rounded-lg bg-black/80 hover:bg-black text-amber-400 border border-amber-500/40 text-[10px] shadow transition-transform active:scale-90"
            title="Ganti Kamera Depan / Belakang"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Camera Error Alert if permissions blocked */}
        {cameraError && (
          <div className="absolute top-14 left-4 max-w-xs p-2.5 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs shadow-2xl z-20">
            {cameraError}. Pastikan izin kamera & mic aktif di browser.
          </div>
        )}
      </div>

      {/* DOCKED BOTTOM AREA: Subtitle + Action Toolbar (Cleanly Stacked, Zero Collision) */}
      <div className="shrink-0 p-3 bg-black/90 border-t border-slate-800/80 backdrop-blur-xl z-30 flex flex-col items-center gap-2">
        {/* User Voice Transcript */}
        {userTranscript && (
          <div className="px-3.5 py-1 rounded-full bg-blue-600/90 border border-blue-400 text-white font-medium text-xs shadow-lg animate-pulse">
            🗣️ Kamu: "{userTranscript}"
          </div>
        )}

        {/* SIBEBEB Speaking Subtitles Box */}
        {subtitles && (
          <div className="max-w-2xl w-full p-2.5 sm:p-3 rounded-2xl bg-slate-950/80 border border-amber-400/40 shadow-xl text-center">
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
              "{subtitles}"
            </p>
          </div>
        )}

        {/* Action Buttons Toolbar (Neatly aligned at the bottom) */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Trigger Scan Object Now */}
          <button
            onClick={() => captureAndAnalyze()}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Menganalisis...' : 'Scan Objek 👁️'}</span>
          </button>

          {/* Auto-scan toggle */}
          <button
            onClick={() => setAutoScanEnabled((p) => !p)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              autoScanEnabled
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Scan objek secara berkala otomatis"
          >
            Auto: {autoScanEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Cheek squish gemoy */}
          <button
            onClick={() => {
              setAvatarEmotion('squish_cheek');
              onSpeak('Aduh pipiku ditarik! Gemoy banget, makasih kak!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition-colors"
          >
            <span>🤏</span>
            <span>Pipi Gemoy</span>
          </button>

          {/* Peace sign pose */}
          <button
            onClick={() => {
              setAvatarGesture('peace_sign');
              setAvatarEmotion('cool_peace');
              onSpeak('Peace out kak! Gaya streetwear kita on-point banget!');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            <span>✌️</span>
            <span>Pose 2 Jari</span>
          </button>
        </div>
      </div>
    </div>
  );
};
