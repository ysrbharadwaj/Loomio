import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserGroupIcon, QrCodeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { communityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const JoinCommunity = () => {
  const { user } = useAuth();
  const [communityCode, setCommunityCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!communityCode || communityCode.length !== 6) {
      setError('Please enter a valid 6-character community code');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await communityAPI.joinCommunity(communityCode.toUpperCase());

      setSuccess(`Successfully joined ${response.data.user.community.name}!`);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join community');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-success-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center animate-fade-in-down">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mb-6 animate-scale-in">
            <UserGroupIcon className="h-8 w-8 text-white animate-pulse-soft" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Join Community
          </h2>
          <p className="text-secondary-600 text-lg">
            Enter your 6-character community code to join
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 animate-scale-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Community Code Field */}
            <div className="space-y-2">
              <label htmlFor="communityCode" className="block text-sm font-semibold text-secondary-700">
                Community Code
              </label>
              <div className="relative">
                <input
                  id="communityCode"
                  name="communityCode"
                  type="text"
                  value={communityCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setCommunityCode(value);
                  }}
                  className={`w-full px-4 py-3 text-center text-2xl font-bold tracking-widest rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    error 
                      ? 'border-error-300 focus:border-error-500 bg-error-50' 
                      : 'border-secondary-200 focus:border-primary-500 bg-white/50 hover:border-primary-300'
                  } placeholder-secondary-400 text-secondary-900`}
                  placeholder="ABC123"
                  maxLength="6"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <QrCodeIcon className="h-6 w-6 text-secondary-400" />
                </div>
              </div>
              <p className="text-xs text-secondary-500 text-center">
                Enter the 6-character code provided by your community admin
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-fade-in">
                <div className="text-sm text-error-700">{error}</div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-success-50 border border-success-200 rounded-xl p-4 animate-fade-in">
                <div className="text-sm text-success-700">{success}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || communityCode.length !== 6}
              className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-primary-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Joining Community...
                </div>
              ) : (
                'Join Community'
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl border border-secondary-200/50">
            <div className="flex items-start space-x-3">
              <ClipboardDocumentIcon className="h-5 w-5 text-primary-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-1">
                  Don't have a community code?
                </h3>
                <p className="text-xs text-secondary-600 mb-3">
                  {(user?.role === 'platform_admin' || user?.role === 'community_admin') 
                    ? 'Ask your community admin for the 6-character join code, or create your own community.'
                    : 'Ask your community admin for the 6-character join code to join a community.'
                  }
                </p>
                {(user?.role === 'platform_admin' || user?.role === 'community_admin') && (
                  <button 
                    onClick={() => navigate('/communities')}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Create New Community →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinCommunity;
