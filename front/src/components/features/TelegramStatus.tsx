import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../../utils/useApi';

interface TelegramStatusProps {
  className?: string;
  showDetails?: boolean;
}

const TelegramStatus: React.FC<TelegramStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { isSignedIn } = useAuth();
  const { makeRequest } = useApi();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    if (!isSignedIn) return;
    
    setLoading(true);
    try {
      // This would check the actual connection status
      // For now, we'll simulate it
      const response = await makeRequest('telegram/status', {
        method: 'GET'
      });
      setIsConnected(response.connected || false);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking Telegram status:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      checkConnection();
    }
  }, [isSignedIn]);

  if (!isSignedIn) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected === null 
            ? 'bg-gray-400' 
            : isConnected 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-red-500'
        }`}></div>
        
        <span className="text-sm font-medium">
          {loading ? 'Checking...' : 
           isConnected === null ? 'Unknown' :
           isConnected ? 'Telegram Connected' : 'Not Connected'}
        </span>
      </div>

      {showDetails && (
        <div className="text-xs text-gray-500">
          {lastChecked && `Last checked: ${lastChecked.toLocaleTimeString()}`}
        </div>
      )}

      <button
        onClick={checkConnection}
        disabled={loading}
        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Refresh'}
      </button>
    </div>
  );
};

export default TelegramStatus; 