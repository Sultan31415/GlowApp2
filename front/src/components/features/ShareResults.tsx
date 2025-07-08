import React, { useState, useCallback, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { Share2, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ShareResultsProps {
  targetRef: React.RefObject<HTMLElement>;
}

const Spinner = ({ className = 'w-6 h-6 mr-3' }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const ShareResults: React.FC<ShareResultsProps> = ({ targetRef }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<'download' | 'share' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);

  useEffect(() => {
    const dummyFile = new File([''], 'dummy.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [dummyFile] })) {
      setIsWebShareSupported(true);
    }
  }, []);

  const generateImage = useCallback(async () => {
    if (!targetRef.current) throw new Error('Target element not found.');
    
    const node = targetRef.current;
    // Make the node visible for capture
    node.style.visibility = 'visible';

    try {
      const blob = await toBlob(targetRef.current, {
        cacheBust: true,
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        fetchRequestInit: {
          headers: { 'Access-Control-Allow-Origin': '*' },
          mode: 'cors',
        },
      });

      if (!blob) throw new Error('Failed to render image');
      return new File([blob], 'glow-results.png', { type: 'image/png' });
    } finally {
      // Hide the node again after capture
      node.style.visibility = 'hidden';
    }
  }, [targetRef]);

  const handleDownload = async () => {
    if (isProcessing) return;
    setActiveAction('download');
    setIsProcessing(true);
    try {
      const file = await generateImage();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ShareResults] Download failed:', error);
      alert('Sorry, creating your shareable image failed.');
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
      setIsModalOpen(false);
    }
  };

  const handleGenericShare = async () => {
    if (isProcessing) return;
    setActiveAction('share');
    setIsProcessing(true);
    try {
      const file = await generateImage();
      await navigator.share({
        files: [file],
        title: 'My Glow Score',
        text: 'Check out my Glow-Up results!',
      });
    } catch (error) {
      console.error('[ShareResults] Generic share failed:', error);
      // Fail silently if user cancels share dialog
      if (!(error as Error).message.includes('Abort')) {
        alert('Sorry, sharing failed.');
      }
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold p-4 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110"
        aria-label="Share results"
      >
        <Share2 className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[200] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-sm p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Share Your Results</h3>
              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center text-lg font-semibold py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isProcessing && activeAction === 'download' ? (
                    <><Spinner /> Processing...</>
                  ) : (
                    <><Download className="w-6 h-6 mr-3" /> Download Image</>
                  )}
                </button>
                {isWebShareSupported && (
                  <button
                    onClick={handleGenericShare}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center text-lg font-semibold py-4 px-6 rounded-xl bg-gray-100 text-gray-800 shadow-md hover:bg-gray-200 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isProcessing && activeAction === 'share' ? (
                      <><Spinner className="w-6 h-6 mr-3 text-gray-800" /> Processing...</>
                    ) : (
                      <><Share2 className="w-6 h-6 mr-3" /> Share via...</>
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full text-center text-gray-600 font-medium mt-8 hover:text-gray-900 transition-colors disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 