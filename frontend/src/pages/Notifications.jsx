import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let url = '/notifications?limit=50';
      if (filter === 'unread') {
        url += '&is_read=false';
      } else if (filter === 'read') {
        url += '&is_read=true';
      }
      
      const response = await api.get(url);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'event':
        return '📅';
      case 'achievement': 
        return '🏆';
      case 'community':
        return '👥';
      default:
        return '📢';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600">
                Stay updated with your community activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Mark All Read
                </button>
              )}
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                <BellIcon className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border p-1">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  filter === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border">
          {error && (
            <div className="p-4 border-b border-red-200 bg-red-50">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.created_at)}</span>
                          {notification.community && (
                            <span>• {notification.community.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.notification_id)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.notification_id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;