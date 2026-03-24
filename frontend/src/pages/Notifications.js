// src/pages/Notifications.js
import React, { useState, useEffect } from 'react';
import notificationsService from '../services/notifications';
import { authService } from '../services/auth';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [preferences, setPreferences] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.list();
      setNotifications(data);
      
      // Update badge count in localStorage
      const unreadCount = data.filter(n => !n.is_read).length;
      localStorage.setItem('notificationCount', unreadCount);
      
      // Dispatch custom event for sidebar to update
      window.dispatchEvent(new CustomEvent('notificationCountUpdate', { detail: unreadCount }));
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const data = await notificationsService.getPreferences();
      setPreferences(data);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      // Set default preferences if none exist
      setPreferences({
        email_enabled: true,
        push_enabled: true,
        appointment_reminders: true,
        lab_results: true,
        prescription_updates: true,
        messages: true,
        weekly_summary: false,
        send_email: true,
        send_push: true
      });
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      setNotifications(updatedNotifications);
      
      // Update badge count
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
      localStorage.setItem('notificationCount', unreadCount);
      window.dispatchEvent(new CustomEvent('notificationCountUpdate', { detail: unreadCount }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updatedNotifications);
      
      // Update badge count
      localStorage.setItem('notificationCount', 0);
      window.dispatchEvent(new CustomEvent('notificationCountUpdate', { detail: 0 }));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await notificationsService.delete(id);
      const updatedNotifications = notifications.filter(n => n.id !== id);
      setNotifications(updatedNotifications);
      
      // Update badge count
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length;
      localStorage.setItem('notificationCount', unreadCount);
      window.dispatchEvent(new CustomEvent('notificationCountUpdate', { detail: unreadCount }));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handlePreferenceUpdate = async () => {
    if (!preferences) return;
    setSavingPrefs(true);
    try {
      await notificationsService.updatePreferences(preferences);
      setShowPreferences(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      alert('Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const getNotificationIcon = (type, priority) => {
    const icons = {
      appointment: 'fas fa-calendar-check text-blue-500',
      report: 'fas fa-file-alt text-purple-500',
      prescription: 'fas fa-prescription-bottle text-green-500',
      lab_result: 'fas fa-microscope text-orange-500',
      message: 'fas fa-envelope text-indigo-500',
      system: 'fas fa-cog text-gray-500',
      reminder: 'fas fa-bell text-yellow-500',
      critical: 'fas fa-exclamation-triangle text-red-500'
    };
    
    if (priority === 'critical') {
      return 'fas fa-exclamation-triangle text-red-500 animate-pulse';
    }
    
    return icons[type] || 'fas fa-bell text-gray-500';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      critical: { color: 'bg-red-100 text-red-800', icon: '⚠️', label: 'Critical' },
      high: { color: 'bg-orange-100 text-orange-800', icon: '🔴', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', label: 'Medium' },
      low: { color: 'bg-blue-100 text-blue-800', icon: '🔵', label: 'Low' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    if (filter === 'critical') return n.priority === 'critical';
    if (filter === 'high') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">
                {unreadCount > 0 ? (
                  <span className="text-blue-600">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    {criticalCount > 0 && ` (${criticalCount} critical)`}
                  </span>
                ) : 'All caught up!'}
              </p>
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notification Settings"
            >
              <i className="fas fa-cog text-xl"></i>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Read
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Critical {criticalCount > 0 && `(${criticalCount})`}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="ml-auto px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <i className="fas fa-bell-slash text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any notifications yet." 
                : `No ${filter} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                  !notification.is_read 
                    ? 'border-l-4 border-l-blue-600' 
                    : 'border-gray-200'
                } ${notification.priority === 'critical' && !notification.is_read ? 'border-l-4 border-l-red-600' : ''}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <i className={getNotificationIcon(notification.type, notification.priority)}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full animate-pulse">
                              New
                            </span>
                          )}
                          {notification.priority === 'critical' && !notification.is_read && (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full animate-pulse">
                              Critical
                            </span>
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <i className="far fa-clock"></i>
                            {getTimeAgo(notification.created_at)}
                          </span>
                          {notification.type && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-tag"></i>
                              <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                            </span>
                          )}
                          {notification.related_url && (
                            <Link
                              to={notification.related_url}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                            >
                              View Details <i className="fas fa-arrow-right text-xs"></i>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Mark as read"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preferences Modal */}
        {showPreferences && preferences && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Email Notifications Section */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-envelope text-gray-500"></i>
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Enable Email Notifications</p>
                        <p className="text-xs text-gray-500">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.email_enabled}
                          onChange={(e) => setPreferences({...preferences, email_enabled: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notification Categories */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <i className="fas fa-bell text-gray-500"></i>
                    Notification Categories
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Appointment Reminders</p>
                        <p className="text-xs text-gray-500">Get notified about upcoming appointments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.appointment_reminders}
                          onChange={(e) => setPreferences({...preferences, appointment_reminders: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Lab Results</p>
                        <p className="text-xs text-gray-500">Get notified when new lab results are ready</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.lab_results}
                          onChange={(e) => setPreferences({...preferences, lab_results: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Prescription Updates</p>
                        <p className="text-xs text-gray-500">Get notified about prescription refills and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.prescription_updates}
                          onChange={(e) => setPreferences({...preferences, prescription_updates: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">New Messages</p>
                        <p className="text-xs text-gray-500">Get notified when you receive new messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.messages}
                          onChange={(e) => setPreferences({...preferences, messages: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Weekly Summary</p>
                        <p className="text-xs text-gray-500">Receive a weekly summary of your activity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.weekly_summary}
                          onChange={(e) => setPreferences({...preferences, weekly_summary: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <i className="fas fa-info-circle mr-1"></i>
                    Critical alerts (patient emergencies, abnormal lab results) are always sent regardless of these settings.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreferenceUpdate}
                  disabled={savingPrefs}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingPrefs ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;