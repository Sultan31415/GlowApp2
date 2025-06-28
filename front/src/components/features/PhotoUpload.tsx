import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, ChevronLeft, Camera, Sparkles, Shield, CheckCircle, AlertCircle, Info } from 'lucide-react';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (uploadedPhoto) {
      const url = URL.createObjectURL(uploadedPhoto);
      setPreviewUrl(url);
      setValidationError(null);
      // Simulate upload progress for better UX - reduced frequency
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 20; // Increased increment to compensate for slower interval
        });
      }, 200); // Changed from 50ms to 200ms (4x less frequent)
      return () => {
        URL.revokeObjectURL(url);
        clearInterval(progressInterval);
      };
    } else {
      setPreviewUrl(null);
      setUploadProgress(0);
    }
  }, [uploadedPhoto]);

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
    setUploadProgress(0);
    onPhotoUpload(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl, onPhotoUpload]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="w-full bg-gray-200 h-1.5">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 transition-all duration-300"
            style={{ width: '90%' }}
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Photo Upload</h3>
                <p className="text-sm text-gray-600">Almost done - last step!</p>
              </div>
            </div>
            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200">Step 2 of 2</div>
          </div>
        </div>
      </div>

             <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
         <div className="max-w-3xl mx-auto">
           {/* Header */}
           <div className="text-center mb-12">
             <div className="inline-flex items-center justify-center mb-8">
               <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
                 <Camera className="w-10 h-10 text-white" />
               </div>
             </div>
             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
               Upload Your Photo
             </h1>
             <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
               Upload a clear, recent photo for AI-powered analysis and personalized avatar generation.
             </p>
           </div>

                     {/* Privacy Notice */}
           <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-10">
             <div className="flex items-start space-x-4">
               <Shield className="w-6 h-6 text-indigo-600 mt-0.5 flex-shrink-0" />
               <div>
                 <h4 className="font-semibold text-indigo-900 mb-2 text-base">Your Privacy Matters</h4>
                 <p className="text-sm sm:text-base text-indigo-700">
                   Your photo is processed securely and used only for analysis. We don't store or share your images.
                 </p>
               </div>
             </div>
           </div>

           {/* Upload Area */}
           <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl shadow-gray-500/15 border border-gray-200/60 mb-10">
            {!previewUrl ? (
                               <div
                   className={`relative border-2 border-dashed rounded-3xl p-12 sm:p-16 text-center transition-all duration-300 cursor-pointer ${
                     dragOver
                       ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]'
                       : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50/50'
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
                   {/* Upload animation */}
                   <div className={`w-20 h-20 mx-auto mb-8 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                     dragOver 
                       ? 'bg-indigo-500 text-white scale-110 rotate-12' 
                       : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-500'
                   }`}>
                     <Upload className={`w-10 h-10 transition-all duration-300 ${dragOver ? 'scale-110' : ''}`} />
                   </div>
                   
                   <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                     {dragOver ? 'Drop your photo here!' : 'Choose your photo'}
                   </h3>
                   
                   <p className="text-gray-600 mb-8 text-base sm:text-lg">
                     Drag and drop your photo here, or click to browse
                   </p>
                   
                   <div className="space-y-6">
                     <button
                       type="button"
                       className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-10 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:scale-105 text-base"
                     >
                       Select Photo
                     </button>
                     
                     <div className="flex items-center justify-center space-x-6 text-sm sm:text-base text-gray-500">
                       <span className="flex items-center">
                         <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                         PNG, JPG, WebP
                       </span>
                       <span className="flex items-center">
                         <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                         Up to 10MB
                       </span>
                     </div>
                   </div>
                   
                   {/* Decorative elements */}
                   <div className="absolute top-6 right-6 w-3 h-3 bg-indigo-200 rounded-full animate-pulse"></div>
                   <div className="absolute bottom-6 left-6 w-4 h-4 bg-purple-200 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                 </div>
            ) : (
              <div className="text-center">
                {/* Upload Progress */}
                {uploadProgress < 100 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-500"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">Processing... {uploadProgress}%</p>
                  </div>
                )}

                {/* Photo Preview */}
                {uploadProgress === 100 && (
                  <div className="relative inline-block mb-6">
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Uploaded photo preview"
                        className="max-w-full max-h-64 rounded-2xl shadow-xl shadow-gray-500/20 ring-4 ring-white"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
                      
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Success indicator */}
                      <div className="absolute -bottom-2 -left-2 bg-green-500 text-white rounded-full p-2 shadow-lg shadow-green-500/30">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Success message */}
                {uploadProgress === 100 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
                    <div className="flex items-center justify-center mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="text-lg font-bold text-gray-900">Perfect!</h3>
                    </div>
                    <p className="text-gray-600">
                      Your photo looks great and is ready for analysis. Let's generate your personalized results!
                    </p>
                  </div>
                )}
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
                  <h4 className="font-semibold text-red-800 mb-1">Upload Error</h4>
                  <p className="text-red-700 text-sm">{validationError}</p>
                </div>
              </div>
            )}

            {/* API Error */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Processing Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Tips for the best results:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use a clear, well-lit photo of your face</li>
                  <li>• Avoid sunglasses or heavy filters</li>
                  <li>• Face the camera directly for accurate analysis</li>
                </ul>
              </div>
            </div>
          </div>

                     {/* Navigation */}
           <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8">
             <button
               onClick={onBack}
               className="flex items-center px-6 py-4 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-md transition-all duration-300 min-h-[3rem]"
             >
               <ChevronLeft className="w-5 h-5 mr-2" />
               Back to Quiz
             </button>

             <button
               onClick={onSubmit}
               disabled={!uploadedPhoto || isSubmitting || uploadProgress < 100}
               className={`flex items-center px-10 py-4 rounded-xl font-semibold transition-all duration-300 min-h-[3rem] text-base ${
                 uploadedPhoto && !isSubmitting && uploadProgress === 100
                   ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transform hover:scale-105'
                   : 'bg-gray-200 text-gray-400 cursor-not-allowed'
               }`}
             >
               {isSubmitting ? (
                 <>
                   <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white mr-3"></div>
                   Generating Results...
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
    </div>
  );
};