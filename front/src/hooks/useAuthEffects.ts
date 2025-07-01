import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Debug logging
  console.log('useAuthEffects - Current location:', location.pathname);
  console.log('useAuthEffects - Has results:', !!results);
  console.log('useAuthEffects - Is signed in:', isSignedIn);

  // Fetch latest results when the user signs in or when navigating to dashboard
  useEffect(() => {
    // Only fetch if on dashboard route and signed in
    if (location.pathname === '/dashboard' && isSignedIn) {
      console.log('useAuthEffects - Fetching latest results for dashboard');
      fetchLatestResults();
    }
  }, [isSignedIn, fetchLatestResults, location.pathname]);

  // When the user has just signed in, automatically navigate to the dashboard
  useEffect(() => {
    if (isSignedIn && location.pathname === '/') {
      console.log('useAuthEffects - Redirecting from home to dashboard (signed in)');
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate, location.pathname]);

  // If user has results and is on exact home page, redirect to dashboard
  // But do NOT redirect if user is on /test or other specific routes
  useEffect(() => {
    if (results && location.pathname === '/') {
      console.log('useAuthEffects - Redirecting from home to dashboard (has results)');
      navigate('/dashboard');
    }
  }, [results, navigate, location.pathname]);

  // Initialize user profile when signed in
  useEffect(() => {
    if (isSignedIn) {
      makeRequest('me').catch(() => {});
    }
  }, [isSignedIn, makeRequest]);
}; 