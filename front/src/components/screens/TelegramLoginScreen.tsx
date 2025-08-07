import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useApi } from '../../utils/useApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AuroraBackground } from '../ui/AuroraBackground';
import { Bot, Copy, Check, RefreshCw } from 'lucide-react';

const TelegramLoginScreen: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { makeRequest } = useApi();
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [copied, setCopied] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (loginCode && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loginCode, timeLeft]);

  // Generate new login code
  const generateCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('telegram/generate-login-code', {
        method: 'POST'
      });
      
      setLoginCode(response.login_code);
      setTimeLeft(300);
    } catch (err) {
      setError('Failed to generate login code. Please try again.');
      console.error('Error generating login code:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async () => {
    if (loginCode) {
      try {
        await navigator.clipboard.writeText(loginCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AuroraBackground>
          <Card className="w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in to connect with Leo on Telegram.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              Go to Sign In
            </Button>
          </Card>
        </AuroraBackground>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuroraBackground>
        <Card className="w-full max-w-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Connect to Leo</h1>
            <p className="text-gray-600">Chat with Leo on Telegram</p>
          </div>

          {!loginCode ? (
            /* Initial State */
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Generate a secure code to connect your account to Leo on Telegram.
              </p>
              
              <Button 
                onClick={generateCode} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Bot className="w-4 h-4 mr-2" />
                    Generate Code
                  </div>
                )}
              </Button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* Code Generated State */
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Your Login Code</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Send this code to @Leo_Oylan_bot on Telegram
                </p>
              </div>

              {/* Login Code Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="text-3xl font-mono font-bold text-center mb-2 tracking-wider text-blue-600">
                  {loginCode}
                </div>
                <div className="text-sm text-gray-500">
                  Expires in {formatTime(timeLeft)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <div className="flex items-center justify-center text-green-600">
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </div>
                  )}
                </Button>
                
                <Button 
                  onClick={generateCode}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Code
                    </div>
                  )}
                </Button>
              </div>

              {timeLeft === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Code expired! Generate a new one.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* User Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </AuroraBackground>
    </div>
  );
};

export default TelegramLoginScreen; 