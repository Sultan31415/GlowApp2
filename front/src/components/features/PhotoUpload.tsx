import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, ChevronLeft, Camera, Sparkles, Shield, CheckCircle, AlertCircle, Info, CameraOff, Eye, Lightbulb, ChevronDown } from 'lucide-react';

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
  const [isTipsOpen, setIsTipsOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900">Photo Analysis</h1>
                <p className="text-xs sm:text-sm text-gray-500">Capture your natural glow</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                2/2
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Main Upload/Capture Area - Placed at the top */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
          {/* Mode Toggle */}
          <div className="flex p-1.5 bg-gray-100/80 rounded-t-2xl border-b border-gray-200/80">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm ${
                mode === 'upload' 
                  ? 'bg-white text-indigo-700 shadow' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </button>
            <button
              type="button"
              onClick={() => setMode('capture')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm ${
                mode === 'capture' 
                  ? 'bg-white text-indigo-700 shadow' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {!previewUrl ? (
              mode === 'upload' ? (
                // Upload View
                <div
                  className="relative border-2 border-dashed rounded-xl p-6 text-center transition-colors duration-300 cursor-pointer group hover:border-indigo-400 hover:bg-indigo-50/50"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                  aria-label="Click or drag and drop to upload photo"
                >
                  <div className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 bg-gray-200/80 group-hover:bg-indigo-100`}>
                    <Upload className={`w-7 h-7 transition-transform duration-300 text-gray-500 group-hover:text-indigo-600`} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {dragOver ? 'Drop your photo here' : 'Click to upload or drag & drop'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, or WebP (max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                // Camera View
                <div className="text-center">
                  {cameraError ? (
                    <div className="max-w-md mx-auto p-4 bg-red-50 rounded-lg text-red-800">
                      <h3 className="font-semibold">Camera Access Required</h3>
                      <p className="text-sm">{cameraError}</p>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div className="relative mb-4">
                        <video
                          ref={videoRef}
                          className="w-full aspect-[4/3] object-cover rounded-lg shadow-md scale-x-[-1]"
                          playsInline muted
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCapture}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-colors duration-300 text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Capture Photo
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              // Preview View
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={previewUrl}
                    alt="Your uploaded photo"
                    className="max-w-full max-h-64 rounded-lg shadow-md"
                  />
                  <button
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Photo ready for analysis!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Messages */}
        {(validationError || error) && (
          <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200/50">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 text-sm">
                  {validationError ? 'Upload Error' : 'Processing Error'}
                </h4>
                <p className="text-red-700 text-xs sm:text-sm leading-relaxed">
                  {validationError || error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pro Tips Section - Accordion on mobile, expanded on desktop */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/50">
          {/* Accordion Header */}
          <button
            className="w-full sm:cursor-default"
            onClick={() => setIsTipsOpen(!isTipsOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-left">
                  Get the Best Results
                </h2>
              </div>
              <ChevronDown className={`w-6 h-6 text-gray-500 transition-transform duration-300 sm:hidden ${isTipsOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {/* Accordion Content */}
          <div className={`pt-4 overflow-hidden transition-all duration-300 ${isTipsOpen ? 'max-h-96' : 'max-h-0'} sm:max-h-full sm:pt-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Eye,
                  title: "Clear visibility",
                  description: "Use natural lighting"
                },
                {
                  icon: Image,
                  title: "Natural photo",
                  description: "Avoid filters or makeup"
                },
                {
                  icon: CheckCircle,
                  title: "High quality",
                  description: "Use a sharp image"
                }
              ].map((tip, index) => (
                <div key={index} className="bg-white/80 rounded-lg p-3 sm:p-4 border border-gray-200/50 flex sm:flex-col items-center sm:text-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <tip.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{tip.title}</h3>
                    <p className="hidden sm:block text-xs text-gray-600">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Privacy Notice */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/50">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Privacy & Security</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Your photo is processed securely and automatically deleted after analysis. We only use it to provide personalized insights.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onBack}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Quiz
          </button>

          <button
            onClick={onSubmit}
            disabled={!uploadedPhoto || isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                <span>Generate My Results</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};