import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, MessageSquare, Shield, Trophy, ThumbsUp, ThumbsDown, Plus, Pencil, Trash2, X, Bot, GraduationCap, Scale, Globe, Microscope, Building2, Palette } from 'lucide-react'
import Header from '../components/Header'
import clubService from '../services/clubService'

const badgeOptions = [
  { id: 'bot', icon: Bot, label: 'Technology' },
  { id: 'graduation', icon: GraduationCap, label: 'Education' },
  { id: 'scale', icon: Scale, label: 'Social Policy' },
  { id: 'globe', icon: Globe, label: 'Environment' },
  { id: 'microscope', icon: Microscope, label: 'Science' },
  { id: 'building', icon: Building2, label: 'Politics' },
  { id: 'palette', icon: Palette, label: 'Arts' }
]
const categoryOptions = ['Technology', 'Education', 'Social Policy', 'Environment', 'Science', 'Politics', 'Arts', 'Sports']

function ClubDetailView({ onBack, darkMode, setDarkMode, getClubBadge, user, isAuthenticated, onShowLogin, onProfileSelect, setClubs }) {
  const { id } = useParams()
  const navigate = useNavigate()
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

  // Discussion create form
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false)
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('')
  const [newDiscussionContent, setNewDiscussionContent] = useState('')
  const [creatingDiscussion, setCreatingDiscussion] = useState(false)

  // Founder edit form
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editBadge, setEditBadge] = useState('')
  const [saving, setSaving] = useState(false)

  const isFounder = clubData && user && clubData.founder_id === user.id

  // Fetch club data on mount
  useEffect(() => {
    const fetchClubData = async () => {
      if (!id) return
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
    fetchClubData()
  }, [id])

  const loadMembers = async () => {
    if (!clubData?.id) return
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
    if (!clubData?.id) return
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

  // Load discussions when joined
  useEffect(() => {
    if (isJoined && clubData?.id) {
      loadDiscussions()
    }
  }, [isJoined, clubData?.id])

  // Load members when members tab is active
  useEffect(() => {
    if (activeTab === 'members' && clubData?.id) {
      loadMembers()
    }
  }, [activeTab, clubData?.id])

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

    const prevJoined = isJoined
    setJoining(true)
    setError(null)

    // Optimistic toggle
    setIsJoined(!prevJoined)

    try {
      if (prevJoined) {
        await clubService.leaveClub(clubData.id)
        setDiscussions([])
      } else {
        await clubService.joinClub(clubData.id)
        await loadDiscussions()
        await loadMembers()
      }
    } catch (err) {
      // Rollback on failure
      setIsJoined(prevJoined)
      setError(err.detail || 'Failed to update club membership')
      console.error('Error updating club membership:', err)
    } finally {
      setJoining(false)
    }
  }

  const handleVoteDiscussion = async (discussionId, voteType) => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }
    if (!isJoined) {
      setError('Join the club to vote on discussions')
      return
    }

    const prevDiscussions = discussions

    // Optimistic update
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      const prevVote = d.user_vote
      const isOff = prevVote === voteType
      if (isOff) {
        return {
          ...d,
          user_vote: null,
          upvotes: Math.max(0, (d.upvotes || 0) + (voteType === 'up' ? -1 : 0)),
          downvotes: Math.max(0, (d.downvotes || 0) + (voteType === 'down' ? -1 : 0)),
        }
      }
      return {
        ...d,
        user_vote: voteType,
        upvotes: Math.max(0, (d.upvotes || 0) + (voteType === 'up' ? 1 : 0) + (prevVote === 'up' ? -1 : 0)),
        downvotes: Math.max(0, (d.downvotes || 0) + (voteType === 'down' ? 1 : 0) + (prevVote === 'down' ? -1 : 0)),
      }
    }))

    try {
      const result = await clubService.voteClubDiscussion(clubData.id, discussionId, voteType)
      setDiscussions(prev => prev.map(d =>
        d.id === discussionId
          ? { ...d, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: result.user_vote }
          : d
      ))
    } catch (err) {
      setDiscussions(prevDiscussions)
      setError(err.detail || 'Failed to vote on discussion')
      console.error('Error voting on discussion:', err)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }
    if (!isJoined) {
      setError('Join the club to create a discussion')
      return
    }
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) {
      setError('Title and content are required')
      return
    }

    try {
      setCreatingDiscussion(true)
      setError(null)
      const created = await clubService.createClubDiscussion(clubData.id, {
        title: newDiscussionTitle,
        content: newDiscussionContent,
      })
      setDiscussions(prev => [{
        ...created,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        user_vote: null,
        author: user?.username || 'You',
      }, ...prev])
      setNewDiscussionTitle('')
      setNewDiscussionContent('')
      setShowCreateDiscussion(false)
    } catch (err) {
      setError(err.detail || 'Failed to create discussion')
      console.error('Error creating discussion:', err)
    } finally {
      setCreatingDiscussion(false)
    }
  }

  const openDiscussion = (discussion) => {
    navigate(`/discussions/${discussion.id}`)
  }

  const openEditModal = () => {
    setEditName(clubData.name)
    setEditDescription(clubData.description || '')
    setEditCategory(clubData.category || '')
    setEditBadge(clubData.badge || 'bot')
    setShowEditModal(true)
  }

  const handleSaveClub = async () => {
    if (!editName.trim()) {
      setError('Club name is required')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const updated = await clubService.updateClub(clubData.id, {
        name: editName,
        description: editDescription,
        category: editCategory,
        badge: editBadge,
      })
      setClubData(updated)
      // Update the list card too
      if (setClubs) {
        setClubs(prev => (prev || []).map(c => c.id === updated.id ? { ...c, name: updated.name, description: updated.description, category: updated.category, badge: updated.badge } : c))
      }
      setShowEditModal(false)
    } catch (err) {
      setError(err.detail || 'Failed to update club')
      console.error('Error updating club:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClub = async () => {
    if (!window.confirm(`Delete club "${clubData.name}"? This action cannot be undone.`)) return
    try {
      setError(null)
      await clubService.deleteClub(clubData.id)
      if (setClubs) {
        setClubs(prev => (prev || []).filter(c => c.id !== clubData.id))
      }
      navigate('/clubs')
    } catch (err) {
      setError(err.detail || 'Failed to delete club')
      console.error('Error deleting club:', err)
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

  if (error && !clubData) {
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
                      Founded by {clubData.founder || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isFounder && (
                  <>
                    <button
                      onClick={openEditModal}
                      className={`p-3 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      title="Edit Club"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDeleteClub}
                      className="p-3 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      title="Delete Club"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
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
            <div className="grid grid-cols-3 gap-4">
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
                <div className="flex items-center justify-center space-x-2 text-purple-500 mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-2xl font-bold">{discussions.length}</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discussions</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`border-b mb-8 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex space-x-8">
              {['overview', 'members', 'discussions'].map((tab) => (
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
                      <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
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
                      <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No recent activity yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {discussions.slice(0, 3).map((discussion) => (
                        <button
                          key={discussion.id}
                          onClick={() => openDiscussion(discussion)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-electric-blue' : 'bg-gray-50 border-gray-200 hover:border-electric-blue'}`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <MessageSquare className="w-5 h-5 text-electric-blue" />
                            <span className="font-medium">New Discussion</span>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(discussion.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="font-medium">{discussion.author}</span> posted "{discussion.title}"
                          </p>
                        </button>
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

            {activeTab === 'discussions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Club Discussions</h3>
                  {isJoined && (
                    <button
                      onClick={() => setShowCreateDiscussion(!showCreateDiscussion)}
                      className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Discussion</span>
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                {showCreateDiscussion && isJoined && (
                  <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className="font-semibold mb-3">Create Discussion</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newDiscussionTitle}
                        onChange={(e) => setNewDiscussionTitle(e.target.value)}
                        placeholder="Discussion title"
                        className={`w-full p-3 border rounded-lg ${
                          darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <textarea
                        rows={3}
                        value={newDiscussionContent}
                        onChange={(e) => setNewDiscussionContent(e.target.value)}
                        placeholder="What do you want to discuss?"
                        className={`w-full p-3 border rounded-lg resize-none ${
                          darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowCreateDiscussion(false)}
                          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateDiscussion}
                          disabled={creatingDiscussion}
                          className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                          {creatingDiscussion ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!isJoined ? (
                  <div className="text-center py-12">
                    <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
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
                    <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h4 className="text-lg font-medium mb-2">No Discussions Yet</h4>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Be the first to start a discussion in this club!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discussions.map((discussion) => (
                      <div
                        key={discussion.id}
                        className={`p-4 rounded-lg border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <button
                            onClick={() => openDiscussion(discussion)}
                            className="text-left font-medium hover:text-electric-blue transition-colors"
                          >
                            {discussion.title}
                          </button>
                          <button
                            onClick={() => onProfileSelect && onProfileSelect(discussion.author)}
                            className={`text-sm ${darkMode ? 'text-gray-400 hover:text-electric-blue' : 'text-gray-600 hover:text-electric-blue'} transition-colors`}
                          >
                            {discussion.author}
                          </button>
                        </div>
                        <button
                          onClick={() => openDiscussion(discussion)}
                          className={`block w-full text-left mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {discussion.content}
                        </button>
                        <div className="flex items-center space-x-4 text-sm">
                          <button
                            onClick={() => handleVoteDiscussion(discussion.id, 'up')}
                            className={`flex items-center space-x-1 transition-colors ${
                              discussion.user_vote === 'up' ? 'text-green-500' : darkMode ? 'text-gray-400 hover:text-green-500' : 'text-gray-600 hover:text-green-500'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" fill={discussion.user_vote === 'up' ? 'currentColor' : 'none'} />
                            <span>{discussion.upvotes || 0}</span>
                          </button>
                          <button
                            onClick={() => handleVoteDiscussion(discussion.id, 'down')}
                            className={`flex items-center space-x-1 transition-colors ${
                              discussion.user_vote === 'down' ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" fill={discussion.user_vote === 'down' ? 'currentColor' : 'none'} />
                            <span>{discussion.downvotes || 0}</span>
                          </button>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {discussion.comment_count || 0} comments
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

        {/* Edit Club Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Edit Club</h3>
                <button onClick={() => setShowEditModal(false)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Club Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full p-3 border rounded-lg ${
                      darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={`w-full p-3 border rounded-lg resize-none ${
                      darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className={`w-full p-3 border rounded-lg ${
                      darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Badge</label>
                  <div className="flex flex-wrap gap-2">
                    {badgeOptions.map((badge) => {
                      const Icon = badge.icon
                      return (
                        <button
                          key={badge.id}
                          onClick={() => setEditBadge(badge.id)}
                          className={`w-10 h-10 rounded-lg border-2 transition-colors flex items-center justify-center ${
                            editBadge === badge.id
                              ? 'border-electric-blue bg-electric-blue/20 text-electric-blue'
                              : darkMode ? 'border-gray-700 hover:border-gray-600 text-gray-400' : 'border-gray-300 hover:border-gray-400 text-gray-600'
                          }`}
                          title={badge.label}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClub}
                  disabled={saving}
                  className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default ClubDetailView
