import { useState, useEffect } from 'react'
import { Settings, User, Bell, Shield, Globe, Send, MessageCircle } from 'lucide-react'
import Header from '../components/Header'
import userService from '../services/userService'
import { useAuth } from '../contexts/AuthContext'

function SettingsView({ darkMode, setDarkMode, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const { updateUser } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [soundEffects, setSoundEffects] = useState(true)
  const [language, setLanguage] = useState('english')
  const [privacy, setPrivacy] = useState('public')
  
  // Profile data
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Telegram state
  const [telegramChatId, setTelegramChatId] = useState('')
  const [telegramUsername, setTelegramUsername] = useState('')
  const [linkingToken, setLinkingToken] = useState('')
  const [isTelegramLinked, setIsTelegramLinked] = useState(false)
  const [linkingTelegram, setLinkingTelegram] = useState(false)
  const [linkMethod, setLinkMethod] = useState('chat_id') // 'chat_id', 'username', or 'token'
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  
  // Load current user data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData()
    }
  }, [isAuthenticated])
  
  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await userService.getCurrentUser()
      
      // Set profile data
      setFullName(userData.full_name || '')
      setBio(userData.bio || '')
      setAvatarUrl(userData.avatar_url || '')
      
      // Set settings
      setNotifications(userData.notifications_enabled ?? true)
      setEmailAlerts(userData.email_alerts ?? false)
      setSoundEffects(userData.sound_effects ?? true)
      setLanguage(userData.language || 'english')
      setPrivacy(userData.privacy || 'public')
      
      // Set Telegram state
      setTelegramChatId(userData.telegram_chat_id || '')
      setTelegramUsername(userData.telegram_username || '')
      setIsTelegramLinked(!!userData.telegram_chat_id)
      
      setError(null)
    } catch (err) {
      setError('Failed to load user data')
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess('')
      
      // Update profile
      await userService.updateProfile({
        full_name: fullName,
        bio: bio
      })
      
      // Update settings
      await userService.updateSettings({
        language: language,
        notifications_enabled: notifications,
        email_alerts: emailAlerts,
        sound_effects: soundEffects,
        privacy: privacy,
      })
      
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save changes')
      console.error('Error saving changes:', err)
    } finally {
      setSaving(false)
    }
  }
  
  const handleLinkTelegram = async () => {
    try {
      setLinkingTelegram(true)
      setError(null)
      
      const payload = {}
      
      if (linkMethod === 'chat_id') {
        if (!telegramChatId.trim()) {
          setError('Please enter your Telegram chat ID')
          setLinkingTelegram(false)
          return
        }
        payload.chat_id = telegramChatId
      } else if (linkMethod === 'username') {
        if (!telegramUsername.trim()) {
          setError('Please enter your Telegram username')
          setLinkingTelegram(false)
          return
        }
        if (!telegramChatId.trim()) {
          setError('Please use the Telegram bot /link command first to get your chat ID')
          setLinkingTelegram(false)
          return
        }
        payload.username = telegramUsername
        payload.chat_id = telegramChatId
      } else if (linkMethod === 'token') {
        if (!linkingToken.trim()) {
          setError('Please enter the linking token from the Telegram bot')
          setLinkingTelegram(false)
          return
        }
        if (!telegramChatId.trim()) {
          setError('Please use the Telegram bot /link command first to get your chat ID')
          setLinkingTelegram(false)
          return
        }
        payload.token = linkingToken
        payload.chat_id = telegramChatId
        payload.username = telegramUsername
      }
      
      await userService.linkTelegram(payload)
      
      setIsTelegramLinked(true)
      setSuccess('Telegram account linked successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || err.detail || 'Failed to link Telegram account')
    } finally {
      setLinkingTelegram(false)
    }
  }
  
  const handleUnlinkTelegram = async () => {
    try {
      setLinkingTelegram(true)
      setError(null)
      
      await userService.unlinkTelegram()
      
      setIsTelegramLinked(false)
      setTelegramChatId('')
      setTelegramUsername('')
      setLinkingToken('')
      setSuccess('Telegram account unlinked successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || err.detail || 'Failed to unlink Telegram account')
    } finally {
      setLinkingTelegram(false)
    }
  }
  
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      setError('New password must contain at least one uppercase letter')
      return
    }
    
    if (!/[a-z]/.test(newPassword)) {
      setError('New password must contain at least one lowercase letter')
      return
    }
    
    if (!/\d/.test(newPassword)) {
      setError('New password must contain at least one digit')
      return
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('New password must contain at least one special character')
      return
    }
    
    try {
      setChangingPassword(true)
      setError(null)
      
      await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      })
      
      setSuccess('Password changed successfully')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || err.detail || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    
    try {
      setUploadingAvatar(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await userService.uploadAvatar(formData)
      
      setAvatarUrl(response.avatar_url)
      setSuccess('Profile picture updated successfully')
      setTimeout(() => setSuccess(''), 3000)
      
      // Refresh user data in auth context
      const freshUserData = await userService.getCurrentUser()
      updateUser(freshUserData)
    } catch (err) {
      setError(err.response?.data?.detail || err.detail || 'Failed to upload profile picture')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="flex-1">
        <Header 
          title="Settings" 
          icon={Settings}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Customize your Digital Arena experience
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Manage your profile, preferences, and account settings all in one place
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Settings</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-electric-blue"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <User className="w-10 h-10" />
                      </div>
                    )}
                    <label className={`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors ${
                      uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                      {uploadingAvatar ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </label>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Upload a profile picture
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-700 text-off-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={`w-full p-3 border rounded-lg resize-none ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-700 text-off-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Push Notifications</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get notified about new debates and replies</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notifications ? 'bg-electric-blue' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Telegram Integration */}
          <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Telegram Integration</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {isTelegramLinked ? (
                <>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} border`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Telegram Connected</p>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {telegramUsername && `Linked to @${telegramUsername}`}
                      {!telegramUsername && `Linked via Chat ID`}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      You will receive notifications for battle invitations, friend requests, and more via Telegram.
                    </p>
                  </div>
                  <button
                    onClick={handleUnlinkTelegram}
                    disabled={linkingTelegram}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {linkingTelegram ? 'Unlinking...' : 'Unlink Telegram Account'}
                  </button>
                </>
              ) : (
                <>
                  {/* Link Method Tabs */}
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => setLinkMethod('chat_id')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        linkMethod === 'chat_id'
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Chat ID
                    </button>
                    <button
                      onClick={() => setLinkMethod('username')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        linkMethod === 'username'
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Username
                    </button>
                    <button
                      onClick={() => setLinkMethod('token')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        linkMethod === 'token'
                          ? 'bg-blue-500 text-white'
                          : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Bot Link
                    </button>
                  </div>

                  {linkMethod === 'chat_id' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Telegram Chat ID
                      </label>
                      <input
                        type="text"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder="Enter your Telegram chat ID"
                        className={`w-full p-3 border rounded-lg ${
                          darkMode 
                            ? 'bg-gray-900 border-gray-700 text-off-white' 
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        To get your chat ID, message @userinfobot on Telegram
                      </p>
                    </div>
                  )}

                  {linkMethod === 'username' && (
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Telegram Username
                        </label>
                        <input
                          type="text"
                          value={telegramUsername}
                          onChange={(e) => setTelegramUsername(e.target.value)}
                          placeholder="@username"
                          className={`w-full p-3 border rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900 border-gray-700 text-off-white' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Chat ID (from Bot)
                        </label>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="Use /link command in the bot first"
                          className={`w-full p-3 border rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900 border-gray-700 text-off-white' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        />
                        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          1. Open our Telegram bot<br/>
                          2. Send /link command<br/>
                          3. Copy the chat ID from the response
                        </p>
                      </div>
                    </div>
                  )}

                  {linkMethod === 'token' && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Easy Link Method:</strong>
                        </p>
                        <ol className={`text-sm mt-2 space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>1. Open our Telegram bot</li>
                          <li>2. Send /link command</li>
                          <li>3. Copy the token from the response</li>
                          <li>4. Paste it below</li>
                        </ol>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Linking Token
                        </label>
                        <input
                          type="text"
                          value={linkingToken}
                          onChange={(e) => setLinkingToken(e.target.value)}
                          placeholder="Paste token from Telegram bot"
                          className={`w-full p-3 border rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900 border-gray-700 text-off-white' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Chat ID (from Bot)
                        </label>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="Also provided by the bot"
                          className={`w-full p-3 border rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900 border-gray-700 text-off-white' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Username (optional)
                        </label>
                        <input
                          type="text"
                          value={telegramUsername}
                          onChange={(e) => setTelegramUsername(e.target.value)}
                          placeholder="@username"
                          className={`w-full p-3 border rounded-lg ${
                            darkMode 
                              ? 'bg-gray-900 border-gray-700 text-off-white' 
                              : 'bg-gray-50 border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleLinkTelegram}
                    disabled={linkingTelegram}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {linkingTelegram ? 'Linking...' : 'Link Telegram Account'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Language */}
          <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Language</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-700 text-off-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="english">English</option>
                  <option value="uzbek">O'zbek</option>
                  <option value="russian">Русский</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security - Full Width */}
        <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacy & Security</span>
            </h2>
          </div>
          <div className="p-6">
            <button
              onClick={() => setShowPasswordModal(true)}
              className={`text-left p-4 rounded-lg border w-full ${
                darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
              } transition-colors`}
            >
              <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Change Password</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Update your account password</p>
            </button>
          </div>
        </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={() => loadUserData()}
              className={`px-6 py-3 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
            </>
          )}
        </main>
      
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-card-bg border border-gray-800' : 'bg-white'} transition-colors duration-300 relative`}>
            <button
              onClick={() => setShowPasswordModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors z-10`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Change Password
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-700 text-off-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-700 text-off-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-700 text-off-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  darkMode
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsView
