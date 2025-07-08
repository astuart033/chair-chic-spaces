import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    console.log('Starting camera with facingMode:', facingMode);
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream first
      if (stream) {
        console.log('Stopping existing stream');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      console.log('Requesting camera access...');
      
      // Try different constraint approaches for better compatibility
      let constraints: MediaStreamConstraints;
      
      try {
        // First try with facingMode
        constraints = {
          video: { 
            facingMode: { ideal: facingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera access granted with facingMode, setting stream');
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback');
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          };
        }
        
      } catch (facingModeError) {
        console.log('Failed with facingMode, trying basic constraints');
        
        // Fallback to basic video constraints
        constraints = {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera access granted with basic constraints, setting stream');
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, starting playback');
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          };
        }
      }
      
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setError(`Camera access failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `profile-photo-${Date.now()}.jpg`, {
              type: 'image/jpeg'
            });
            onCapture(file);
            handleClose();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  }, [onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isOpen]); // Removed startCamera and stopCamera from deps to prevent infinite loop

  // Restart camera when facing mode changes (but only if dialog is open)
  useEffect(() => {
    if (isOpen && stream) {
      startCamera();
    }
  }, [facingMode]); // Only depend on facingMode

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Take Profile Photo
          </DialogTitle>
          <DialogDescription>
            Position yourself in the camera view and click "Take Photo" when ready.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black text-white p-4">
                <div className="text-center">
                  <p className="text-sm">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startCamera}
                    className="mt-2 text-black"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                display: isLoading || error ? 'none' : 'block'
              }}
            />
            
            {/* Camera controls overlay */}
            {!isLoading && !error && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={switchCamera}
                  className="w-10 h-10 rounded-full p-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleCapture}
              disabled={isLoading || error !== null || !stream}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}