import React from 'react';
import { SignIn } from '@clerk/clerk-react';

/**
 * Detects if the current user-agent is an in-app browser (e.g. Instagram, Facebook, Threads, TikTok).
 * Google OAuth blocks these embedded browsers, resulting in the
 * `Error 403: disallowed_useragent` screen.  When such an environment is
 * detected we display helpful instructions instead of the normal Clerk
 * <SignIn> component.
 */
const isInAppBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  // A non-exhaustive list of keywords found in popular in-app browsers
  const keywords = [
    'FBAN', // Facebook for iOS
    'FBAV', // Facebook for Android
    'Instagram',
    'InstagramApp',
    'Line',
    'Twitter',
    'Snapchat',
    'TikTok',
    'Threads',
    'WhatsApp',
  ];
  return keywords.some((k) => ua.includes(k));
};

export const CustomSignIn: React.FC = () => {
  const [embedded, setEmbedded] = React.useState(false);

  React.useEffect(() => {
    setEmbedded(isInAppBrowser());
  }, []);

  if (embedded) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-6">
        <h1 className="text-2xl font-bold">Open in Your Browser</h1>
        <p className="text-gray-700">
          Google login isn&rsquo;t available inside this in-app browser. Tap the menu (⋯) and choose
          “Open in Chrome/Safari”, then try signing in again.
        </p>
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 transition-colors"
          onClick={() => window.open(window.location.href, '_blank')}
        >
          Open in Browser
        </button>
      </div>
    );
  }

  // Normal sign-in UI when not in an embedded browser
  return <SignIn routing="path" path="/sign-in" />;
};

export default CustomSignIn;
