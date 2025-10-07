import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!editForm.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!editForm.email.trim()) {
      setError('Email is required');
      return;
    }

    if (editForm.new_password && editForm.new_password !== editForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email
      };

      if (editForm.new_password) {
        updateData.current_password = editForm.current_password;
        updateData.new_password = editForm.new_password;
      }

      const response = await api.put(`/users/${user.user_id}`, updateData);
      
      // Update user context
      updateUser(response.data.user);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setEditForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Profile
              </h1>
              <p className="text-gray-600">
                Manage your account and preferences
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Avatar Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {user?.full_name}
              </h2>
              
              <div className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
                <span className="capitalize">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                <TrophyIcon className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-gray-900">{user?.points || 0} Points</span>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Profile Information
                </h3>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 font-medium transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  ) : (
                    <div className="text-gray-900 font-medium">
                      {user?.full_name}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center mb-3">
                      <EnvelopeIcon className="w-6 h-6 text-emerald-400 mr-3 animate-bounce" />
                      <label className="text-lg font-bold text-white">Email Address</label>
                    </div>
                    <div className="text-xl text-white/80 font-medium">
                      {user?.email} 📧
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center mb-3">
                      <CalendarIcon className="w-6 h-6 text-pink-400 mr-3 animate-bounce" />
                      <label className="text-lg font-bold text-white">Join Date</label>
                    </div>
                    <div className="text-xl text-white/80 font-medium">
                      {user?.join_date ? new Date(user.join_date).toLocaleDateString() : 'N/A'} 📅
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center mb-3">
                      <UserGroupIcon className="w-6 h-6 text-orange-400 mr-3 animate-bounce" />
                      <label className="text-lg font-bold text-white">Community</label>
                    </div>
                    <div className="text-xl text-white/80 font-medium">
                      {user?.community?.name || 'No community assigned'} 🏘️
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="group relative flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white font-bold text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 animate-morphing"></div>
                    <CogIcon className="relative z-10 w-7 h-7 mr-3 group-hover:animate-wiggle" />
                    <span className="relative z-10">Edit Profile ⚙️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
