import React, { useState, useRef } from 'react';
import { Upload, Image, X, ChevronLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
              <Image className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Upload Your Photo
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Upload a clear, recent photo of yourself for AI avatar generation and personalized results.
            </p>
          </div>

          {/* Upload Area */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 mb-8">
            {!previewUrl ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragOver
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`w-16 h-16 mx-auto mb-4 ${dragOver ? 'text-purple-500' : 'text-gray-400'}`} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Drag and drop your photo here
                </h3>
                <p className="text-gray-600 mb-6">
                  or click to select a file from your device
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Select Photo
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  PNG, JPG up to 10MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <img
                    src={previewUrl}
                    alt="Uploaded photo"
                    className="max-w-full max-h-64 rounded-2xl shadow-lg"
                  />
                  <button
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Photo uploaded successfully!
                </h3>
                <p className="text-gray-600">
                  Your photo looks great. Ready to generate your results?
                </p>
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
              <p className="text-red-500 text-center mt-4 text-sm">
                {error}
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center px-6 py-3 rounded-full font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Quiz
            </button>

            <button
              onClick={onSubmit}
              disabled={!uploadedPhoto || isSubmitting}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                uploadedPhoto && !isSubmitting
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Generating...' : 'Generate My Results'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};