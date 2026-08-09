import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, MessageSquare, Shield, Trophy, Pencil, Trash2, X, Send, Bot, GraduationCap, Scale, Globe, Microscope, Building2, Palette, CornerDownRight } from 'lucide-react'
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

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Insert a reply into the correct spot in a message's reply tree
function insertReply(messages, messageId, parentId, newReply) {
  return messages.map(m => {
    if (m.id !== messageId) return m
    const replies = insertReplyNode(m.replies || [], parentId, newReply)
    return { ...m, replies }
  })
}

function insertReplyNode(replies, parentId, newReply) {
  if (parentId === null || parentId === undefined) {
    return [...(replies || []), newReply]
  }
  return (replies || []).map(r => {
    if (r.id === parentId) {
      return { ...r, replies: [...(r.replies || []), newReply] }
    }
    return { ...r, replies: insertReplyNode(r.replies || [], parentId, newReply) }
  })
}

function Avatar({ src, name, darkMode, size = 'w-8 h-8' }) {
  return (
    <div className={`${size} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {(name || '?').charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

function ReplyThread({ replies, darkMode, onProfileSelect, onReply, replyTarget, replyText, setReplyText, submitReply }) {
  return (
    <div className="mt-3 space-y-3">
      {replies.map((reply) => (
        <div key={reply.id} className={`pl-3 ml-4 border-l-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-start space-x-2">
            <Avatar src={reply.avatar_url} name={reply.author} darkMode={darkMode} size="w-6 h-6" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <button
                  onClick={() => onProfileSelect && onProfileSelect(reply.author)}
                  className={`text-sm font-medium hover:text-electric-blue transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {reply.author}
                </button>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {formatRelativeTime(reply.created_at)}
                </span>
                <button
                  onClick={() => onReply(reply.id)}
                  className={`text-xs ${darkMode ? 'text-gray-400 hover:text-electric-blue' : 'text-gray-500 hover:text-electric-blue'}`}
                >
                  Reply
                </button>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{reply.content}</p>

              {reply.replies && reply.replies.length > 0 && (
                <ReplyThread
                  replies={reply.replies}
                  darkMode={darkMode}
                  onProfileSelect={onProfileSelect}
                  onReply={onReply}
                  replyTarget={replyTarget}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  submitReply={submitReply}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClubDetailView({ onBack, darkMode, setDarkMode, getClubBadge, user, isAuthenticated, onShowLogin, onProfileSelect, setClubs }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('chat')
  const [isJoined, setIsJoined] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [clubData, setClubData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Chat composer
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  // Reply composer: target = messageId (root) and parentId (reply) or null
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const chatEndRef = useRef(null)

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

  const loadChat = async () => {
    if (!clubData?.id) return
    try {
      setLoadingMessages(true)
      const data = await clubService.getClubChat(clubData.id)
      setMessages(data)
    } catch (err) {
      console.error('Error loading chat:', err)
      setError(err.detail || 'Failed to load chat')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Load chat when joined
  useEffect(() => {
    if (isJoined && clubData?.id && activeTab === 'chat') {
      loadChat()
    }
  }, [isJoined, clubData?.id, activeTab])

  // Load members when members tab is active
  useEffect(() => {
    if (activeTab === 'members' && clubData?.id) {
      loadMembers()
    }
  }, [activeTab, clubData?.id])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, activeTab])

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
        setMessages([])
      } else {
        await clubService.joinClub(clubData.id)
        await loadChat()
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

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }
    if (!isJoined) {
      setError('Join the club to chat')
      return
    }
    const text = newMessage.trim()
    if (!text) return

    setNewMessage('')
    setSendingMessage(true)

    // Optimistic append
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId,
      content: text,
      author: user?.username || 'You',
      author_id: user?.id,
      avatar_url: user?.avatar_url || null,
      created_at: new Date().toISOString(),
      replies: [],
    }])

    try {
      const real = await clubService.postClubMessage(clubData.id, text)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...real, replies: [] } : m))
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError(err.detail || 'Failed to send message')
      console.error('Error sending message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSubmitReply = async (messageId) => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }
    if (!isJoined) {
      setError('Join the club to chat')
      return
    }
    const text = replyText.trim()
    const parentId = replyTarget?.parentId ?? null
    if (!text) return

    setReplyText('')
    setReplyTarget(null)
    setSendingReply(true)

    // Optimistic append
    const tempId = `temp-${Date.now()}`
    const tempReply = {
      id: tempId,
      content: text,
      author: user?.username || 'You',
      author_id: user?.id,
      avatar_url: user?.avatar_url || null,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      replies: [],
    }
    setMessages(prev => insertReply(prev, messageId, parentId, tempReply))

    try {
      const real = await clubService.replyToClubMessage(clubData.id, messageId, text, parentId)
      setMessages(prev => removeTempReply(prev, messageId, tempId))
      setMessages(prev => insertReply(prev, messageId, parentId, { ...real, replies: [] }))
    } catch (err) {
      setMessages(prev => removeTempReply(prev, messageId, tempId))
      setError(err.detail || 'Failed to post reply')
      console.error('Error posting reply:', err)
    } finally {
      setSendingReply(false)
    }
  }

  const removeTempReply = (messages, messageId, tempId) => {
    return messages.map(m => {
      if (m.id !== messageId) return m
      const replies = removeNode(m.replies || [], tempId)
      return { ...m, replies }
    })
  }

  const removeNode = (replies, id) => {
    const result = (replies || []).filter(r => r.id !== id)
    return result.map(r => ({ ...r, replies: removeNode(r.replies || [], id) }))
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
                  <span className="text-2xl font-bold">{messages.length}</span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Messages</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`border-b mb-8 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex space-x-8">
              {['chat', 'members'].map((tab) => (
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
            {activeTab === 'chat' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Club Chat</h3>

                {!isJoined ? (
                  <div className="text-center py-12">
                    <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h4 className="text-lg font-medium mb-2">Join to Chat</h4>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      You must be a member of this club to join the conversation.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Composer */}
                    <div className={`p-4 rounded-lg border mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center space-x-3">
                        <Avatar src={user?.avatar_url} name={user?.username || 'You'} darkMode={darkMode} size="w-9 h-9" />
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                          placeholder={`Message ${clubData.name}...`}
                          className={`flex-1 p-3 rounded-lg outline-none ${
                            darkMode ? 'bg-gray-900 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !newMessage.trim()}
                          className="p-3 rounded-lg bg-electric-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    {loadingMessages ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <h4 className="text-lg font-medium mb-2">No messages yet</h4>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Start the conversation!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div key={message.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-start space-x-3">
                              <Avatar src={message.avatar_url} name={message.author} darkMode={darkMode} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <button
                                    onClick={() => onProfileSelect && onProfileSelect(message.author)}
                                    className={`font-medium hover:text-electric-blue transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                  >
                                    {message.author}
                                  </button>
                                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {formatRelativeTime(message.created_at)}
                                  </span>
                                </div>
                                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{message.content}</p>

                                <div className="mt-2">
                                  <button
                                    onClick={() => setReplyTarget({ messageId: message.id, parentId: null })}
                                    className={`text-xs flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-electric-blue' : 'text-gray-500 hover:text-electric-blue'}`}
                                  >
                                    <CornerDownRight className="w-3 h-3" />
                                    <span>Reply</span>
                                  </button>
                                </div>

                                {/* Reply composer for this message */}
                                {replyTarget && replyTarget.messageId === message.id && (
                                  <div className="mt-3">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        autoFocus
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmitReply(message.id) } }}
                                        placeholder={replyTarget.parentId ? `Reply to a message...` : `Reply to ${message.author}...`}
                                        className={`flex-1 p-2 rounded-lg text-sm outline-none ${
                                          darkMode ? 'bg-gray-900 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                                        }`}
                                      />
                                      <button
                                        onClick={() => handleSubmitReply(message.id)}
                                        disabled={sendingReply || !replyText.trim()}
                                        className="p-2 rounded-lg bg-electric-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                                      >
                                        <Send className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => { setReplyTarget(null); setReplyText('') }}
                                        className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Replies */}
                                {message.replies && message.replies.length > 0 && (
                                  <ReplyThread
                                    replies={message.replies}
                                    darkMode={darkMode}
                                    onProfileSelect={onProfileSelect}
                                    onReply={(parentId) => setReplyTarget({ messageId: message.id, parentId })}
                                    replyTarget={replyTarget}
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    submitReply={handleSubmitReply}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </>
                )}
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
