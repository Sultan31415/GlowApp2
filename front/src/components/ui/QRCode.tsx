import React, { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 200, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const generateQRCode = async () => {
      try {
        // Simple QR code generation using a basic algorithm
        // In production, you might want to use a library like qrcode
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Generate a simple pattern (this is a placeholder)
        // In a real implementation, you'd use a proper QR code library
        ctx.fillStyle = '#000000';
        
        // Create a simple grid pattern as placeholder
        const gridSize = Math.floor(size / 25);
        for (let i = 0; i < 25; i++) {
          for (let j = 0; j < 25; j++) {
            if ((i + j) % 2 === 0) {
              ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
            }
          }
        }

        // Add text overlay for now
        ctx.fillStyle = '#666666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', size / 2, size / 2);
        ctx.fillText('(Placeholder)', size / 2, size / 2 + 20);

      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`border border-gray-200 rounded-lg ${className}`}
    />
  );
};

export default QRCode; 