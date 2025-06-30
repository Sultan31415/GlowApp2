import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, ChevronLeft, Camera, Sparkles, Shield, CheckCircle, AlertCircle, Info, CameraOff } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoUpload: (file: File) => void;
  onBack: () => void;
  onSubmit: () => void;
  uploadedPhoto: File | null;
  isSubmitting: boolean;
  error: string | null;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoUpload,
  onBack,
  onSubmit,
  uploadedPhoto,
  isSubmitting,
  error
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera capture states
  const [mode, setMode] = useState<'upload' | 'capture'>('upload');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  React.useEffect(() => {
    if (uploadedPhoto) {
      const url = URL.createObjectURL(uploadedPhoto);
      setPreviewUrl(url);
      setValidationError(null);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedPhoto]);

  // Initialize / cleanup camera stream when in capture mode
  React.useEffect(() => {
    if (mode === 'capture' && !previewUrl) {
      const enableStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setCameraError(null);
        } catch (err) {
          console.error(err);
          setCameraError('Unable to access camera. Please allow camera permissions or upload a photo instead.');
        }
      };
      enableStream();

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
    }
  }, [mode, previewUrl]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (blob) {
          const file = new File([blob], 'captured_photo.png', { type: 'image/png' });
          onPhotoUpload(file);
          setMode('capture'); // remain in capture mode to allow retake
        }
      }, 'image/png');
    }
  }, [onPhotoUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        onPhotoUpload(file);
      }
    }
  }, [onPhotoUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        onPhotoUpload(file);
      }
    }
  }, [onPhotoUpload]);

  const isValidFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      setValidationError('Please upload a PNG, JPG, or WebP file.');
      return false;
    }
    
    if (file.size > maxSize) {
      setValidationError('File size must be less than 10MB.');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const removePhoto = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onPhotoUpload(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [previewUrl, onPhotoUpload]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="min-h-screen aurora-bg">
      {/* Clean Header */}
      <div className="relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-teal-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/60 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4 border border-gray-200/50">
                <Camera className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-medium text-slate-700">Photo Upload</h1>
                <p className="text-slate-500 text-sm">Final step - let's capture your glow</p>
              </div>
            </div>
            <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
              Step 2 of 2
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6 relative z-10">
        
        {/* Privacy Notice */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Your Privacy Matters</h3>
              <p className="text-gray-600 text-sm">
                Your photo is processed securely and used only for analysis. We don't store or share your images.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1 shadow-lg">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                mode === 'upload' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => setMode('capture')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                mode === 'capture' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Take Photo
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8">
          {!previewUrl ? (
            mode === 'upload' ? (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFileDialog();
                  }
                }}
                aria-label="Click to upload photo or drag and drop"
              >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  dragOver 
                    ? 'bg-indigo-500 text-white scale-110' 
                    : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-500'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {dragOver ? 'Drop your photo here!' : 'Upload your photo'}
                </h3>
                
                <p className="text-gray-600 mb-8">
                  Drag and drop your photo here, or click to browse
                </p>
                
                <div className="space-y-4">
                  <button
                    type="button"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Select Photo
                  </button>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      PNG, JPG, WebP
                    </span>
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Up to 10MB
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                {cameraError ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3">
                    <CameraOff className="w-6 h-6 text-red-500" />
                    <p className="text-sm text-red-700">{cameraError}</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full max-w-md mx-auto rounded-2xl shadow-xl mb-6 scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Capture Photo
                    </button>
                  </>
                )}
              </div>
            )
          ) : (
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Uploaded photo preview"
                    className="max-w-full max-h-64 rounded-2xl shadow-xl ring-4 ring-white"
                  />
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Success indicator */}
                  <div className="absolute -bottom-2 -left-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Success message */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Perfect!</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Your photo looks great and is ready for analysis.
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="File upload input"
          />
          
          {/* Validation Error */}
          {validationError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Upload Error</h4>
                <p className="text-red-700 text-sm">{validationError}</p>
              </div>
            </div>
          )}

          {/* API Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Processing Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tips for best results:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use a clear, well-lit photo of your face</li>
                <li>• Avoid sunglasses or heavy filters</li>
                <li>• Face the camera directly for accurate analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Quiz
          </button>

          <button
            onClick={onSubmit}
            disabled={!uploadedPhoto || isSubmitting}
            className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
              uploadedPhoto && !isSubmitting
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                Generating Results...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                Generate My Results
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};