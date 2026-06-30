import React, { useState } from 'react'
import { Sun, Moon, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function Header({ title, icon, darkMode, setDarkMode, showBackButton, onBack, children, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const { logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowProfileMenu(false)
  }

  return (
    <header className={`border-b ${darkMode ? 'border-gray-800 bg-card-bg' : 'border-gray-200 bg-white'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button 
                onClick={onBack}
                className={`${darkMode ? 'text-gray-400 hover:text-off-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                ← Back
              </button>
            )}
            {icon && React.createElement(icon, { className: "w-8 h-8 text-electric-blue" })}
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {children}
            
            {/* User Profile Section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onProfileSelect && user?.username && onProfileSelect(user.username)
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${
                      darkMode ? 'bg-electric-blue/20' : 'bg-blue-100'
                    }`}
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-electric-blue" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`text-sm font-medium hover:text-electric-blue transition-colors ${darkMode ? 'text-off-white' : 'text-gray-900'}`}
                  >
                    {user.username}
                  </button>
                </div>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } z-50`}>
                    <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${darkMode ? 'text-off-white' : 'text-gray-900'}`}>
                        {user.full_name || user.username}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.email}
                      </p>
                      <div className={`flex items-center space-x-2 mt-1`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ELO: {user.elo_rating || 400}
                        </span>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-50 text-red-600'
                        }`}
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onShowLogin}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-electric-blue text-white hover:bg-blue-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Sign In
              </button>
            )}
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
