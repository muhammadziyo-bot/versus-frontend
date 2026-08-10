import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { User, Calendar, Target, Shield, MessageCircle } from 'lucide-react'
import Header from '../components/Header'
import userService from '../services/userService'

function ProfileView({ darkMode, setDarkMode, user, isAuthenticated, onShowLogin, onBack, onProfileSelect }) {
  const { username } = useParams()
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const data = await userService.getUserProfile(username)
      setProfileUser(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || err.detail || 'Failed to load user profile')
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (username) {
      loadUserProfile()
    } else {
      setError('Invalid username parameter')
      setLoading(false)
    }
  }, [username])

  if (loading) {
    return (
      <div className="flex-1">
        <Header 
          title="Profile" 
          icon={User}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className="flex-1">
        <Header 
          title="Profile" 
          icon={User}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className={`p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg`}>
            {error || 'User not found'}
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="flex-1">
      <Header 
        title="Profile" 
        icon={User}
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        user={user}
        isAuthenticated={isAuthenticated}
        onShowLogin={onShowLogin}
        onProfileSelect={onProfileSelect}
      />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className={`mb-6 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          {/* Profile Header */}
          <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} mb-6`}>
            <div className="p-6">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {profileUser.avatar_url ? (
                    <img
                      src={profileUser.avatar_url}
                      alt={profileUser.username}
                      className="w-32 h-32 rounded-full object-cover border-4 border-electric-blue"
                    />
                  ) : (
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <User className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold">{profileUser.full_name || profileUser.username}</h1>
                  </div>
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    @{profileUser.username}
                  </p>
                  {profileUser.bio && (
                    <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                      {profileUser.bio}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profileUser.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} p-6 mb-6`}>
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-5 h-5 text-electric-blue" />
              <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ELO Rating</span>
            </div>
            <p className="text-3xl font-bold">{profileUser.elo_rating || 400}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              Starting ELO: 400 | Win +8 | Lose -8
            </p>
          </div>

          {/* Action Buttons */}
          {isAuthenticated && user && user.id !== profileUser.id && (
            <div className="flex space-x-4">
              <button className={`flex-1 px-6 py-3 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Send Message</span>
                </div>
              </button>
              <button className={`flex-1 px-6 py-3 rounded-lg bg-electric-blue text-white hover:bg-blue-600 transition-colors`}>
                <div className="flex items-center justify-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Challenge to Debate</span>
                </div>
              </button>
            </div>
          )}
        </main>
    </div>
  )
}

export default ProfileView
