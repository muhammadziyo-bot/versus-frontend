import { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2, Sword } from 'lucide-react'
import notificationService from '../services/notificationService'

function NotificationCenter({ darkMode, isOpen, onClose, user, isAuthenticated, onNavigateToBattle }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [isOpen, isAuthenticated])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationService.getNotifications()
      setNotifications(data)
    } catch (err) {
      setError(err.detail || 'Failed to load notifications')
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const handleBattleInvitation = (notification) => {
    try {
      // Handle both string and object data
      let data = null
      if (notification.data) {
        if (typeof notification.data === 'string') {
          data = JSON.parse(notification.data)
        } else {
          data = notification.data
        }
      }
      
      if (data && data.battle_id && onNavigateToBattle) {
        onNavigateToBattle(data.battle_id)
        onClose()
      }
    } catch (err) {
      console.error('Error parsing notification data:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md ${
        darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'
      } border-l shadow-2xl`}>
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-electric-blue" />
              <h2 className="text-xl font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-electric-blue text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="mt-3 text-sm text-electric-blue hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100%-80px)] p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-medium mb-2">No Notifications</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.is_read
                      ? darkMode
                        ? 'bg-gray-900/50 border-gray-800 opacity-70'
                        : 'bg-gray-50 border-gray-200 opacity-70'
                      : darkMode
                        ? 'bg-gray-800 border-electric-blue/50'
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{notification.title}</h4>
                    <div className="flex items-center space-x-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {notification.message && (
                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                  )}
                  {notification.type === 'battle_invitation' && (
                    <button
                      onClick={() => handleBattleInvitation(notification)}
                      className="mt-2 w-full bg-electric-blue text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2 text-sm"
                    >
                      <Sword className="w-4 h-4" />
                      <span>Join Battle Room</span>
                    </button>
                  )}
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter
