import { Camera, RotateCcw } from 'lucide-react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Typography,
} from '../ui';

function getCameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    return 'Permissão da câmera negada. Habilite nas configurações do navegador.';
  }

  if (err instanceof DOMException && err.name === 'NotFoundError') {
    return 'Nenhuma câmera encontrada neste dispositivo.';
  }

  return 'Não foi possível acessar a câmera.';
}

type CameraModalProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export const CameraModal: FC<CameraModalProps> = ({ open, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearCapture = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setCapturedBlob(null);
    setPreviewUrl(null);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError(getCameraErrorMessage(err));
    }
  }, [stopStream]);

  useEffect(() => {
    if (!open) {
      stopStream();
      clearCapture();
      return stopStream;
    }

    startCamera();
    return stopStream;
  }, [open, startCamera, stopStream, clearCapture]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    stopStream();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setCapturedBlob(blob);
        setPreviewUrl(url);
      },
      'image/jpeg',
      0.9,
    );
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    clearCapture();
    startCamera();
  }, [clearCapture, startCamera]);

  const handleConfirm = useCallback(() => {
    if (!capturedBlob) return;
    const file = new File([capturedBlob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    onClose();
  }, [capturedBlob, onCapture, onClose]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tirar Selfie</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Typography variant="body2" className="text-destructive text-center">
                {error}
              </Typography>
              <Button variant="outline" onClick={startCamera}>
                Tentar novamente
              </Button>
            </div>
          ) : previewUrl ? (
            <>
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-primary">
                <img
                  src={previewUrl}
                  alt="Selfie capturada"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetake}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Tirar outra
                </Button>
                <Button onClick={handleConfirm}>
                  <Camera className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-primary">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <Typography variant="caption" className="text-muted-foreground text-center">
                Centralize seu rosto no círculo
              </Typography>
              <Button onClick={handleCapture} size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Tirar foto
              </Button>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};
