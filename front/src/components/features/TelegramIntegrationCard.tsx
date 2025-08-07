import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import TelegramStatus from './TelegramStatus';

const TelegramIntegrationCard: React.FC = () => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.27-.48.74-.74 2.87-1.25 4.79-2.09 5.76-2.51 2.7-1.18 3.26-1.38 3.64-1.39.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Telegram Integration</h3>
            <p className="text-sm text-gray-600">Chat with Leo on Telegram</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <TelegramStatus showDetails={false} />
      </div>

      <div className="space-y-3">
        <Link
          to="/telegram-login"
          className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
        >
          Connect Telegram
        </Link>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Chat with Leo from your phone</p>
          <p>• Get instant responses</p>
          <p>• Secure end-to-end encryption</p>
        </div>
      </div>
    </Card>
  );
};

export default TelegramIntegrationCard; 