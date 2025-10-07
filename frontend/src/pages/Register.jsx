import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, UserPlusIcon, CheckCircleIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '6s'}}></div>
      </div>

      <div className="relative z-10 max-w-lg w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center animate-fade-in-down">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center mb-6 animate-scale-in shadow-2xl shadow-emerald-500/50 animate-glow">
            <UserPlusIcon className="h-10 w-10 text-white animate-pulse-soft" />
          </div>
          <h2 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-bounce-gentle">
            Join Loomio
          </h2>
          <p className="text-white/80 text-xl font-medium">
            Create your account and start <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-bold">collaborating</span>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-8 animate-scale-in hover:shadow-emerald-500/20 hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="space-y-2">
              <label htmlFor="full_name" className="block text-sm font-semibold text-secondary-700">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.full_name 
                      ? 'border-error-300 focus:border-error-500 bg-error-50' 
                      : 'border-secondary-200 focus:border-primary-500 bg-white/50 hover:border-primary-300'
                  } placeholder-secondary-400 text-secondary-900`}
                  placeholder="Enter your full name"
                />
                {formData.full_name && !errors.full_name && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <CheckCircleIcon className="h-5 w-5 text-success-400 animate-scale-in" />
                  </div>
                )}
              </div>
              {errors.full_name && (
                <p className="text-sm text-error-600 animate-fade-in">{errors.full_name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-secondary-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.email 
                      ? 'border-error-300 focus:border-error-500 bg-error-50' 
                      : 'border-secondary-200 focus:border-primary-500 bg-white/50 hover:border-primary-300'
                  } placeholder-secondary-400 text-secondary-900`}
                  placeholder="Enter your email"
                />
                {formData.email && !errors.email && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse-soft"></div>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-error-600 animate-fade-in">{errors.email}</p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-semibold text-secondary-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-500 bg-white/50 hover:border-primary-300 focus:outline-none focus:ring-0 transition-all duration-200 text-secondary-900"
              >
                <option value="member">Member</option>
                <option value="community_admin">Community Admin</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-secondary-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.password 
                      ? 'border-error-300 focus:border-error-500 bg-error-50' 
                      : 'border-secondary-200 focus:border-primary-500 bg-white/50 hover:border-primary-300'
                  } placeholder-secondary-400 text-secondary-900`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-error-600 animate-fade-in">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-secondary-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    errors.confirmPassword 
                      ? 'border-error-300 focus:border-error-500 bg-error-50' 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-success-300 focus:border-success-500 bg-success-50'
                      : 'border-secondary-200 focus:border-primary-500 bg-white/50 hover:border-primary-300'
                  } placeholder-secondary-400 text-secondary-900`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-error-600 animate-fade-in">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-sm text-success-600 animate-fade-in flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-fade-in">
                <div className="text-sm text-error-700">{errors.general}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-600 hover:to-primary-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-accent-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-secondary-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-accent-600 hover:text-accent-500 transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
