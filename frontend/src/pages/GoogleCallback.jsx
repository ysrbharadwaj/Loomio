import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const errorParam = searchParams.get('error');

        console.log('Google OAuth Callback - Token:', token ? 'Present' : 'Missing');
        console.log('Google OAuth Callback - Refresh Token:', refreshToken ? 'Present' : 'Missing');

        if (errorParam) {
          console.error('Google authentication error:', errorParam);
          setError('Google authentication failed. Please try again.');
          setTimeout(() => navigate('/login?error=google_auth_failed'), 2000);
          return;
        }

        if (!token || !refreshToken) {
          console.error('Missing tokens in callback');
          setError('Invalid authentication response. Please try again.');
          setTimeout(() => navigate('/login?error=invalid_callback'), 2000);
          return;
        }

        // Store tokens and complete login
        console.log('Completing Google login...');
        await loginWithGoogle(token, refreshToken);
        console.log('Google login successful, redirecting to dashboard...');
        navigate('/app/dashboard');
      } catch (err) {
        console.error('Failed to complete Google login:', err);
        setError('Failed to complete sign in. Please try again.');
        setTimeout(() => navigate('/login?error=login_failed'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="text-center max-w-md mx-auto p-8">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Error</h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <LoadingSpinner size="lg" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Completing Google Sign In</h2>
              <p className="text-gray-600 dark:text-gray-400">Please wait while we set up your account...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;

