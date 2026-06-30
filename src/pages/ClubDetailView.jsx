import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Sword, Sun, Moon, Users, MessageSquare, TrendingUp, Settings, HelpCircle, Shield, Calendar, Trophy, MessageCircle } from 'lucide-react'
import Header from '../components/Header'
import clubService from '../services/clubService'

function ClubDetailView({ onBack, darkMode, setDarkMode, onNavigate, getClubBadge, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [isJoined, setIsJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)
  const [discussions, setDiscussions] = useState([])
  const [loadingDiscussions, setLoadingDiscussions] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [clubData, setClubData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch club data on mount
  useEffect(() => {
    const fetchClubData = async () => {
      if (id) {
        try {
          setLoading(true)
          const freshClubData = await clubService.getClub(id)
          setClubData(freshClubData)
          setIsJoined(freshClubData.is_member || freshClubData.isMember)
        } catch (err) {
          console.error('Error fetching club data:', err)
          setError('Failed to load club')
        } finally {
          setLoading(false)
        }
      }
    }
    fetchClubData()
  }, [id, isAuthenticated])
  
  // Handle navigation back to main app
  const handleNavigation = (view) => {
    onNavigate(view) // Use the passed navigation function
  }

  // Load club discussions
  useEffect(() => {
    if (isJoined && clubData?.id) {
      loadDiscussions()
    }
    if (clubData?.id) {
      loadMembers()
    }
  }, [isJoined, clubData?.id])

  useEffect(() => {
    if (activeTab === 'members' && clubData?.id && !loadingMembers && members.length === 0) {
      loadMembers()
    }
  }, [activeTab, clubData?.id])

  const loadMembers = async () => {
    try {
      setLoadingMembers(true)
      const data = await clubService.getClubMembers(clubData.id)
      setMembers(data)
    } catch (err) {
      console.error('Error loading members:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const loadDiscussions = async () => {
    try {
      setLoadingDiscussions(true)
      const data = await clubService.getClubDiscussions(clubData.id)
      setDiscussions(data)
    } catch (err) {
      console.error('Error loading discussions:', err)
    } finally {
      setLoadingDiscussions(false)
    }
  }

  const getRoleLabel = (member) => {
    if (member.is_founder) return 'Founder'
    if (member.is_admin) return 'Moderator'
    return 'Member'
  }

  const formatJoinDate = (joinedAt) => {
    if (!joinedAt) return 'Unknown'
    const date = new Date(joinedAt)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const handleJoinClub = async () => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }

    try {
      setJoining(true)
      setError(null)

      if (isJoined) {
        await clubService.leaveClub(clubData.id)
        setIsJoined(false)
        setDiscussions([])
      } else {
        await clubService.joinClub(clubData.id)
        setIsJoined(true)
        // Load discussions and members after joining
        await loadDiscussions()
        await loadMembers()
      }
    } catch (err) {
      setError(err.detail || 'Failed to update club membership')
      console.error('Error updating club membership:', err)
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1">
        <Header 
          title="Loading Club..." 
          icon={Shield}
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

  if (error || !clubData) {
    return (
      <div className="flex-1">
        <Header 
          title="Error" 
          icon={Shield}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error || 'Club not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <Header 
        title={clubData.name} 
        icon={Shield}
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        showBackButton={true}
        onBack={onBack}
        user={user}
        isAuthenticated={isAuthenticated}
        onShowLogin={onShowLogin}
        onProfileSelect={onProfileSelect}
      />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Club Header */}
          <div className={`rounded-lg p-6 border mb-8 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-electric-blue ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  {getClubBadge(clubData.badge)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{clubData.name}</h1>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {clubData.category}
                    </span>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Founded by {clubData.founder || clubData.created_by || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleJoinClub}
                disabled={joining}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isJoined
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-electric-blue text-white hover:bg-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {joining ? 'Processing...' : isJoined ? '✓ Member' : 'Join Club'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {clubData.description}
            </p>

            {/* Club Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-center space-x-2 text-electric-blue mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">{clubData.member_count || clubData.memberCount || 0}</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Members</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-center space-x-2 text-orange-500 mb-2">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">{clubData.active_battles || clubData.activeBattles || 0}</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Battles</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-center space-x-2 text-green-500 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-2xl font-bold">{clubData.upcoming_battles || clubData.upcomingBattles || 0}</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upcoming</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-center space-x-2 text-purple-500 mb-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-2xl font-bold">{discussions.length}</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discussions</p>
              </div>
            </div>
          </div>

          {/* Focus Areas */}
          <div className={`rounded-lg p-6 border mb-8 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-semibold mb-4">Focus Areas</h3>
            <div className="flex flex-wrap gap-2">
              {(clubData.focus || [clubData.category] || ['General']).map((area, index) => (
                <span 
                  key={index}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`border-b mb-8 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex space-x-8">
              {['overview', 'members', 'battles', 'discussions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-electric-blue text-electric-blue'
                      : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                  {!isJoined ? (
                    <div className="text-center py-8">
                      <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Join the club to see recent activity
                      </p>
                    </div>
                  ) : loadingDiscussions ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : discussions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No recent activity yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {discussions.slice(0, 3).map((discussion) => (
                        <div key={discussion.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center space-x-3 mb-2">
                            <MessageCircle className="w-5 h-5 text-electric-blue" />
                            <span className="font-medium">New Discussion</span>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(discussion.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <button
                              onClick={() => onProfileSelect && onProfileSelect(discussion.author)}
                              className="font-medium hover:text-electric-blue transition-colors"
                            >
                              {discussion.author}
                            </button> posted "{discussion.title}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Club Members ({members.length})</h3>
                {loadingMembers ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h4 className="text-lg font-medium mb-2">No members yet</h4>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Be the first to join this club!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => onProfileSelect && onProfileSelect(member.username)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}
                            >
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-medium">{member.username.charAt(0).toUpperCase()}</span>
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => onProfileSelect && onProfileSelect(member.username)}
                                  className="font-medium hover:text-electric-blue transition-colors"
                                >
                                  {member.username}
                                </button>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  member.is_founder ? 'bg-electric-blue/20 text-electric-blue' :
                                  member.is_admin ? 'bg-green-500/20 text-green-500' :
                                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {getRoleLabel(member)}
                                </span>
                              </div>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Joined {formatJoinDate(member.joined_at)} • ELO: {member.elo_rating || 400}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'battles' && (
              <div className="text-center py-12">
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h4 className="text-lg font-medium mb-2">Club Battles Coming Soon</h4>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Club battles will be available in a future update. Stay tuned!
                </p>
              </div>
            )}

            {activeTab === 'discussions' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Club Discussions</h3>
                {!isJoined ? (
                  <div className="text-center py-12">
                    <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h4 className="text-lg font-medium mb-2">Join to View Discussions</h4>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      You must be a member of this club to view and participate in discussions.
                    </p>
                  </div>
                ) : loadingDiscussions ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : discussions.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h4 className="text-lg font-medium mb-2">No Discussions Yet</h4>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Be the first to start a discussion in this club!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discussions.map((discussion) => (
                      <div key={discussion.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{discussion.title}</h4>
                          <div className="flex items-center space-x-2 text-sm">
                            <button
                              onClick={() => onProfileSelect && onProfileSelect(discussion.author)}
                              className={`${darkMode ? 'text-gray-400 hover:text-electric-blue' : 'text-gray-600 hover:text-electric-blue'} transition-colors`}
                            >
                              {discussion.author}
                            </button>
                          </div>
                        </div>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                          {discussion.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            ↑ {discussion.upvotes}
                          </span>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            ↓ {discussion.downvotes}
                          </span>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(discussion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

export default ClubDetailView
