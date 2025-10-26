import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google authentication error:', error);
        navigate('/login?error=google_auth_failed');
        return;
      }

      if (token && refreshToken) {
        try {
          await loginWithGoogle(token, refreshToken);
          navigate('/app/dashboard');
        } catch (err) {
          console.error('Failed to complete Google login:', err);
          navigate('/login?error=login_failed');
        }
      } else {
        navigate('/login?error=invalid_callback');
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing Google sign in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
