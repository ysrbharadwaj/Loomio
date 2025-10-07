import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      setErrors({ general: error });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ''
      }));
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const result = await login(formData);
    setIsSubmitting(false);
    
    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="animate-pulse-soft">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '6s'}}></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center animate-fade-in-down">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 animate-scale-in shadow-2xl shadow-purple-500/50 animate-glow">
            <SparklesIcon className="h-10 w-10 text-white animate-pulse-soft" />
          </div>
          <h2 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-bounce-gentle">
            Welcome Back
          </h2>
          <p className="text-white/80 text-xl font-medium">
            Sign in to your <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent font-bold">Loomio</span> account
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-8 animate-scale-in hover:shadow-purple-500/20 hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-white/90 tracking-wide">
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 bg-white/10 backdrop-blur-xl ${
                    errors.email 
                      ? 'border-red-400 focus:border-red-500 bg-red-500/10 shadow-red-500/20' 
                      : 'border-white/20 focus:border-cyan-400 hover:border-purple-400 focus:shadow-2xl focus:shadow-cyan-500/20'
                  } placeholder-white/50 text-white font-medium group-hover:scale-105 transform`}
                  placeholder="Enter your email"
                />
                {formData.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse-soft shadow-lg shadow-green-400/50"></div>
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {errors.email && (
                <p className="text-sm text-red-300 animate-fade-in font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-white/90 tracking-wide">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-6 py-4 pr-14 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-0 bg-white/10 backdrop-blur-xl ${
                    errors.password 
                      ? 'border-red-400 focus:border-red-500 bg-red-500/10 shadow-red-500/20' 
                      : 'border-white/20 focus:border-cyan-400 hover:border-purple-400 focus:shadow-2xl focus:shadow-cyan-500/20'
                  } placeholder-white/50 text-white font-medium group-hover:scale-105 transform`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/60 hover:text-cyan-400 transition-all duration-300 hover:scale-110 transform"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              {errors.password && (
                <p className="text-sm text-red-300 animate-fade-in font-medium">{errors.password}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-4 animate-fade-in backdrop-blur-xl">
                <div className="text-sm text-red-300 font-medium">{errors.general}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-3" />
                    <span className="text-lg">Signing in...</span>
                  </div>
                ) : (
                  <span className="text-lg tracking-wide">Sign In ✨</span>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/70 text-lg">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text hover:from-cyan-300 hover:to-pink-300 transition-all duration-300 hover:scale-110 inline-block transform"
            >
              Create one here ✨
            </Link>
          </p>
        </div>

        {/* Join Community Link */}
        <div className="text-center mt-6">
          <Link
            to="/join"
            className="inline-flex items-center space-x-2 text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105 transform bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 hover:border-white/40 hover:shadow-xl hover:shadow-purple-500/20"
          >
            <UserGroupIcon className="h-5 w-5" />
            <span>Join a Community</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
