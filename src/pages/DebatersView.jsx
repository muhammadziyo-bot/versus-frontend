import React, { useState, useEffect } from 'react'
import { Users, Trophy, MessageSquare, TrendingUp, Target, Bolt, Star, Gem, Calendar } from 'lucide-react'
import Header from '../components/Header'

function DebatersView({ userStats, dataLoading, darkMode, setDarkMode, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const [activeTab, setActiveTab] = useState('all')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard(activeTab)
  }, [activeTab])

  const fetchLeaderboard = async (period) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/users/leaderboard?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvatarIcon = (rank) => {
    return <Star className="w-6 h-6" />
  }

  return (
    <div className="flex-1">
      <Header 
        title="Top Debaters" 
        icon={Users}
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
              ELO Leaderboard
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Compete in battles to climb the ranks. Win +8 ELO, Lose -8 ELO.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className={`flex justify-center mb-8 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} rounded-lg p-1 border`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-electric-blue text-white'
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'monthly'
                  ? 'bg-electric-blue text-white'
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'weekly'
                  ? 'bg-electric-blue text-white'
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
          </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-electric-blue" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Users</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : userStats.total_users || 0}</div>
          </div>
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-6 h-6 text-venom-red" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Debaters</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : userStats.active_users || 0}</div>
          </div>
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Battles</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : userStats.total_battles || 0}</div>
          </div>
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Top Debaters</span>
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : leaderboard.length || 0}</div>
          </div>
        </div>

        {/* Top Debaters List */}
        <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}">
            <h2 className="text-2xl font-bold">
              {activeTab === 'all' ? 'All Time Rankings' : activeTab === 'monthly' ? 'Monthly Rankings' : 'Weekly Rankings'}
            </h2>
          </div>
          <div className="divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-opacity-50 hover:bg-electric-blue/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden text-electric-blue ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      {getAvatarIcon()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{entry.full_name || entry.username}</h3>
                        <button
                          onClick={() => onProfileSelect && onProfileSelect(entry.username)}
                          className={`text-sm hover:text-electric-blue transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          @{entry.username}
                        </button>
                        <span className={`px-2 py-1 text-xs rounded ${entry.rank <= 3 ? 'bg-orange-500/20 text-orange-500' : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                          #{entry.rank}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 mt-1">
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          ELO: {entry.elo_rating}
                        </span>
                        {activeTab !== 'all' && (
                          <span className={`text-sm font-medium ${entry.elo_gained >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {entry.elo_gained >= 0 ? '+' : ''}{entry.elo_gained} ELO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onProfileSelect && onProfileSelect(entry.username)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))) : (
              <div className="text-center py-12">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className="text-xl font-semibold mb-2">No rankings yet</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Start battling to appear on the leaderboard!
                </p>
              </div>
            )}
          </div>
        </div>
        </main>
    </div>
  )
}

export default DebatersView
