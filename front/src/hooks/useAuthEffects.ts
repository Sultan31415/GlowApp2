import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AssessmentResults } from '../types';
import { useApi } from '../utils/useApi';

interface UseAuthEffectsProps {
  results: AssessmentResults | null;
  fetchLatestResults: () => Promise<void>;
}

export const useAuthEffects = ({ results, fetchLatestResults }: UseAuthEffectsProps) => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { makeRequest } = useApi();

  // Fetch latest results when the user signs in or when navigating to dashboard
  useEffect(() => {
    // Only fetch if on dashboard route and signed in
    if (window.location.pathname === '/dashboard' && isSignedIn) {
      fetchLatestResults();
    }
  }, [isSignedIn, fetchLatestResults]);

  // When the user has just signed in, automatically navigate to the dashboard
  useEffect(() => {
    if (isSignedIn && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  // If user has results and is on home page, redirect to dashboard
  useEffect(() => {
    if (results && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [results, navigate]);

  // Initialize user profile when signed in
  useEffect(() => {
    if (isSignedIn) {
      makeRequest('me').catch(() => {});
    }
  }, [isSignedIn, makeRequest]);
}; 