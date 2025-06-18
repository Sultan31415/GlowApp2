import React, { useState, useRef } from 'react';
import { Upload, Image, X, ChevronLeft, Camera, Sparkles } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (uploadedPhoto) {
      const url = URL.createObjectURL(uploadedPhoto);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedPhoto]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        onPhotoUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        onPhotoUpload(file);
      }
    }
  };

  const isValidFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG or JPG file.');
      return false;
    }
    
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return false;
    }
    
    return true;
  };

  const removePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onPhotoUpload(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Camera className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
              Upload Your Photo
            </h1>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Upload a clear, recent photo of yourself for AI avatar generation and personalized results.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white/70 backdrop-blur-sm rounded-4xl p-12 shadow-xl shadow-gray-500/5 border border-gray-100 mb-12">
            {!previewUrl ? (
              <div
                className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${
                  dragOver
                    ? 'border-purple-500 bg-purple-50/50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className={`w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  dragOver ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Drag and drop your photo here
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  or click to select a file from your device
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-105"
                >
                  Select Photo
                </button>
                <p className="text-sm text-gray-500 mt-6">
                  PNG, JPG up to 10MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Uploaded photo"
                      className="max-w-full max-h-80 rounded-3xl shadow-xl shadow-gray-500/10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
                  </div>
                  <button
                    onClick={removePhoto}
                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl p-3 shadow-lg shadow-red-500/25 transition-all duration-300 hover:scale-110"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Photo uploaded successfully!
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Your photo looks great. Ready to generate your results?
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-center font-medium">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center px-8 py-4 rounded-2xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Quiz
            </button>

            <button
              onClick={onSubmit}
              disabled={!uploadedPhoto || isSubmitting}
              className={`flex items-center px-10 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                uploadedPhoto && !isSubmitting
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Results
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};