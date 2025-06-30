import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, ChevronLeft, Camera, Sparkles, Shield, CheckCircle, AlertCircle, Info, CameraOff, Eye, Lightbulb } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header with Improved Typography */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Photo Analysis</h1>
                <p className="text-sm text-gray-500">Capture your natural glow</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Final Step
              </div>
              <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200">
                2/2
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Pro Tips Section - Redesigned for Better Visual Impact */}
        <div className="relative">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mr-4">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Get the Best Results
              </h2>
            </div>
            <p className="text-gray-600 max-w-md mx-auto">
              Follow these tips for accurate skin analysis
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: Eye,
                title: "Clear visibility",
                description: "Use natural lighting and face the camera directly"
              },
              {
                icon: Image,
                title: "Natural photo",
                description: "Avoid heavy filters, makeup or sunglasses"
              },
              {
                icon: CheckCircle,
                title: "High quality",
                description: "Sharp, well-focused image works best"
              }
            ].map((tip, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <tip.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-2 shadow-xl">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  mode === 'upload' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setMode('capture')}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  mode === 'capture' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </button>
            </div>
          </div>
        </div>

        {/* Main Upload/Capture Area - Redesigned */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {!previewUrl ? (
            mode === 'upload' ? (
              <div
                className={`relative border-2 border-dashed rounded-3xl m-6 p-12 text-center transition-all duration-500 cursor-pointer group ${
                  dragOver
                    ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-indigo-50'
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
                {/* Animated Upload Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                  dragOver 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white scale-110 rotate-6' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-500 group-hover:scale-110'
                }`}>
                  <Upload className={`w-10 h-10 transition-transform duration-500 ${dragOver ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {dragOver ? 'Drop it like it\'s hot! 🔥' : 'Upload Your Photo'}
                </h3>
                
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Drag and drop your selfie here, or click to browse your device
                </p>
                
                <div className="space-y-6">
                  <button
                    type="button"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Choose Photo
                  </button>
                  
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center bg-green-50 px-3 py-2 rounded-full">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      PNG, JPG, WebP
                    </span>
                    <span className="flex items-center bg-green-50 px-3 py-2 rounded-full">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Up to 10MB
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                {cameraError ? (
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <CameraOff className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Camera Access Required</h3>
                    <p className="text-gray-600 mb-6">{cameraError}</p>
                    <button
                      onClick={() => setMode('upload')}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg"
                    >
                      Upload Instead
                    </button>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <div className="relative mb-8">
                      <video
                        ref={videoRef}
                        className="w-full aspect-[3/4] object-cover rounded-3xl shadow-2xl scale-x-[-1] ring-4 ring-white"
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 rounded-3xl ring-2 ring-indigo-500/20 pointer-events-none"></div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center mx-auto"
                    >
                      <Camera className="w-5 h-5 mr-3" />
                      Capture Photo
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="p-8 text-center">
              <div className="relative inline-block mb-8">
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Your uploaded photo"
                    className="max-w-full max-h-80 rounded-3xl shadow-2xl ring-4 ring-white object-cover"
                  />
                  
                  {/* Enhanced overlay with better positioning */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Remove button with better styling */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto();
                    }}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 group-hover:scale-100 scale-0"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Success indicator */}
                  <div className="absolute bottom-4 left-4 bg-green-500 text-white rounded-full p-3 shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Enhanced success message */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 max-w-md mx-auto">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Perfect Shot!</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Your photo looks amazing and is ready for AI analysis. Our system will provide personalized skincare insights.
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
        </div>

        {/* Enhanced Error Messages */}
        {(validationError || error) && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-red-200/50 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-2">
                  {validationError ? 'Upload Error' : 'Processing Error'}
                </h4>
                <p className="text-red-700 text-sm leading-relaxed">
                  {validationError || error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Privacy Notice */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Privacy & Security</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your photo is processed securely using advanced AI. We protect your privacy and only use your image to provide personalized skincare insights. Your data is encrypted and automatically deleted after analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex items-center px-6 py-3 rounded-2xl font-medium text-gray-600 hover:text-gray-900 hover:bg-white/70 transition-all duration-300 group"
          >
            <ChevronLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Quiz
          </button>

          <button
            onClick={onSubmit}
            disabled={!uploadedPhoto || isSubmitting}
            className={`flex items-center px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
              uploadedPhoto && !isSubmitting
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white mr-3"></div>
                Analyzing Your Glow...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-3" />
                Generate My Results
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};