import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BellIcon, 
  EnvelopeIcon, 
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('notifications');

  const [emailPreferences, setEmailPreferences] = useState({
    notifications: true,
    taskAssignments: true,
    taskReminders: true,
    communityUpdates: true,
    weeklyDigest: false
  });

  // Load current preferences
  useEffect(() => {
    if (user?.email_preferences) {
      setEmailPreferences(user.email_preferences);
    }
  }, [user]);

  const handlePreferenceChange = (key) => {
    setEmailPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/email-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emailPreferences)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update preferences');
      }

      setMessage({ 
        type: 'success', 
        text: 'Email preferences updated successfully!' 
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update email preferences' 
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Notification Settings Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <EnvelopeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Email Notifications
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose which emails you want to receive
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* All Notifications */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications"
                  type="checkbox"
                  checked={emailPreferences.notifications}
                  onChange={() => handlePreferenceChange('notifications')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="notifications" className="font-medium text-gray-900 dark:text-white">
                  All Notifications
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email for all in-app notifications
                </p>
              </div>
            </div>

            {/* Task Assignments */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="taskAssignments"
                  type="checkbox"
                  checked={emailPreferences.taskAssignments}
                  onChange={() => handlePreferenceChange('taskAssignments')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="taskAssignments" className="font-medium text-gray-900 dark:text-white">
                  Task Assignments
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when you're assigned to a task
                </p>
              </div>
            </div>

            {/* Task Reminders */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="taskReminders"
                  type="checkbox"
                  checked={emailPreferences.taskReminders}
                  onChange={() => handlePreferenceChange('taskReminders')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="taskReminders" className="font-medium text-gray-900 dark:text-white">
                  Deadline Reminders
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive reminders about upcoming task deadlines
                </p>
              </div>
            </div>

            {/* Community Updates */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="communityUpdates"
                  type="checkbox"
                  checked={emailPreferences.communityUpdates}
                  onChange={() => handlePreferenceChange('communityUpdates')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="communityUpdates" className="font-medium text-gray-900 dark:text-white">
                  Community Updates
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get updates about your communities, events, and announcements
                </p>
              </div>
            </div>

            {/* Weekly Digest */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="weeklyDigest"
                  type="checkbox"
                  checked={emailPreferences.weeklyDigest}
                  onChange={() => handlePreferenceChange('weeklyDigest')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="weeklyDigest" className="font-medium text-gray-900 dark:text-white">
                  Weekly Digest
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive a weekly summary of your tasks and community activity
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </div>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Profile Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Profile customization coming soon...
          </p>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Privacy Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Privacy controls coming soon...
          </p>
        </div>
      )}
    </div>
  );
};

export default Settings;
