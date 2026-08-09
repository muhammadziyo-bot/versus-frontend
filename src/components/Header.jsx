import React, { useState, useEffect } from 'react'
import { Sun, Moon, User, LogOut, Settings, Menu, X, Users, MessageSquare, Shield, Sword, UserPlus, HelpCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  { icon: Sword, label: 'Arena', view: 'arena', path: '/' },
  { icon: Users, label: 'Debaters', view: 'debaters', path: '/debaters' },
  { icon: MessageSquare, label: 'Discussions', view: 'discussions', path: '/discussions' },
  { icon: Shield, label: 'Clubs', view: 'clubs', path: '/clubs' },
  { icon: UserPlus, label: 'Friends', view: 'friends', path: '/friends' },
  { icon: Settings, label: 'Settings', view: 'settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help', view: 'help', path: '/help' }
]

const getCurrentViewFromPath = (pathname) => {
  if (pathname === '/') return 'arena'
  if (pathname.startsWith('/debaters')) return 'debaters'
  if (pathname.startsWith('/discussions')) return 'discussions'
  if (pathname.startsWith('/clubs')) return 'clubs'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/help')) return 'help'
  if (pathname.startsWith('/friends')) return 'friends'
  if (pathname.startsWith('/battle')) return 'arena'
  return 'arena'
}

function Header({ title, icon, darkMode, setDarkMode, showBackButton, onBack, children, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowProfileMenu(false)
  }

  // Close the mobile drawer when the route changes
  useEffect(() => {
    setShowMobileMenu(false)
  }, [location.pathname])

  // Close the mobile drawer on Escape key
  useEffect(() => {
    if (!showMobileMenu) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowMobileMenu(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showMobileMenu])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showMobileMenu])

  const currentView = getCurrentViewFromPath(location.pathname)

  return (
    <>
    <header className={`border-b ${darkMode ? 'border-gray-800 bg-card-bg' : 'border-gray-200 bg-white'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {showBackButton && (
              <button
                onClick={onBack}
                className={`flex-shrink-0 ${darkMode ? 'text-gray-400 hover:text-off-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                ← Back
              </button>
            )}
            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open navigation menu"
              className={`md:hidden p-2 rounded-lg flex-shrink-0 ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
            >
              <Menu className="w-6 h-6" />
            </button>
            {icon && React.createElement(icon, { className: "w-8 h-8 text-electric-blue flex-shrink-0" })}
            <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center space-x-4 flex-shrink-0">
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
                    className={`text-sm font-medium hover:text-electric-blue transition-colors hidden sm:block ${darkMode ? 'text-off-white' : 'text-gray-900'}`}
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

    {/* Mobile Navigation Drawer */}
    <div
      className={`fixed inset-0 z-50 md:hidden ${
        showMobileMenu ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={() => setShowMobileMenu(false)}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          showMobileMenu ? 'opacity-50' : 'opacity-0'
        }`}
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] shadow-xl flex flex-col transition-transform duration-300 ${
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        } ${darkMode ? 'bg-card-bg border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}
      >
        <div className={`flex items-center justify-between px-4 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <span className={`text-lg font-bold ${darkMode ? 'text-off-white' : 'text-gray-900'}`}>Menu</span>
          <button
            onClick={() => setShowMobileMenu(false)}
            aria-label="Close navigation menu"
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => {
            const active = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  active
                    ? darkMode
                      ? 'bg-gray-800 text-electric-blue'
                      : 'bg-gray-100 text-electric-blue'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className={`px-4 py-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Digital Arena</p>
        </div>
      </div>
    </div>
    </>
  )
}

export default Header
