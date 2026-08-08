import React, { useState } from 'react'
import { MessageSquare, Users, TrendingUp, Settings, HelpCircle, Target, Pin, Clock, Bolt, Star, Gem, Reply, MoreHorizontal, Share, Bookmark, Flag, ThumbsUp, ThumbsDown } from 'lucide-react'
import Header from '../components/Header'
import discussionService from '../services/discussionService'

const getAvatarIcon = (avatar) => {
  // Handle both old emoji avatars and potential new icon IDs
  switch(avatar) {
    case '🎯':
    case 'target':
      return <Target className="w-5 h-5" />;
    case '🔥':
    case 'trending':
      return <TrendingUp className="w-5 h-5" />;
    case '⚡':
    case 'bolt':
      return <Bolt className="w-5 h-5" />;
    case '🌟':
    case 'star':
      return <Star className="w-5 h-5" />;
    default: return <Users className="w-5 h-5" />;
  }
}

function DiscussionsView({ discussions, setDiscussions, discussionStats, dataLoading, darkMode, setDarkMode, user, isAuthenticated, onShowLogin, refreshData, onDiscussionSelect, onProfileSelect }) {
  const [sortBy, setSortBy] = useState('hot') // hot, new, top, controversial
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false)
  const [userBookmarks, setUserBookmarks] = useState(new Set())
  const [error, setError] = useState(null)
  
  // New discussion form state
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Error boundary for data fetching
  if (error) {
    return (
      <div className={`min-h-screen flex ${darkMode ? 'bg-academic-midnight text-off-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
        <div className="flex-1">
          <Header 
            title="Community Discussions" 
            icon={MessageSquare}
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            user={user}
            isAuthenticated={isAuthenticated}
            onShowLogin={onShowLogin}
          />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-red-500">Error loading discussions: {error}</p>
              <button 
                onClick={() => { setError(null); if (refreshData) refreshData(); }}
                className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const categories = ["All", "Technology", "Social Policy", "Environment", "Business", "Education", "Health"]

  // Transform real discussion data to match the expected format
  const formattedDiscussions = (discussions || []).map(discussion => {
    try {
      return {
        ...discussion,
        lastActivity: discussion.last_activity ? new Date(discussion.last_activity).toLocaleString() : "Recently",
        upvotes: discussion.upvotes || 0,
        downvotes: discussion.downvotes || 0,
        userVote: discussion.user_vote || null,
        isBookmarked: userBookmarks.has(discussion.id)
      }
    } catch (err) {
      console.error('Error formatting discussion:', err)
      return null
    }
  }).filter(Boolean) // Filter out any null values from errors

  // Handle bookmarking
  const handleBookmark = (discussionId) => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }
    
    setUserBookmarks(prev => {
      const newBookmarks = new Set(prev)
      if (newBookmarks.has(discussionId)) {
        newBookmarks.delete(discussionId)
      } else {
        newBookmarks.add(discussionId)
      }
      return newBookmarks
    })
  }

  // Handle creating a new discussion
  const handleCreateDiscussion = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      onShowLogin()
      return
    }

    setIsCreating(true)
    setCreateError('')

    try {
      const tagsArray = newDiscussion.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const discussionData = {
        title: newDiscussion.title,
        content: newDiscussion.content,
        club_id: null, // Optional: can be linked to a club
        tags: tagsArray
      }

      await discussionService.createDiscussion(discussionData)
      
      // Reset form and close modal
      setNewDiscussion({ title: '', content: '', category: '', tags: '' })
      setShowNewDiscussionModal(false)
      
      // Refresh discussions
      if (refreshData) {
        refreshData()
      }
    } catch (error) {
      console.error('Failed to create discussion:', error)
      setCreateError(error.detail || 'Failed to create discussion. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle selecting a discussion and navigating to detail view
  const handleSelectDiscussion = (discussion) => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }
    if (onDiscussionSelect) {
      onDiscussionSelect(discussion)
    }
  }

  // Handle voting on a discussion
  const handleVoteDiscussion = async (discussionId, voteType) => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }

    const prevDiscussions = discussions

    // Optimistic: update the specific discussion immediately
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      const prevVote = d.user_vote
      const isTogglingOff = prevVote === voteType
      const upvotes = d.upvotes || 0
      const downvotes = d.downvotes || 0

      if (isTogglingOff) {
        return {
          ...d,
          user_vote: null,
          upvotes: Math.max(0, upvotes + (voteType === 'up' ? -1 : 0)),
          downvotes: Math.max(0, downvotes + (voteType === 'down' ? -1 : 0)),
        }
      }

      return {
        ...d,
        user_vote: voteType,
        upvotes: Math.max(0, upvotes + (voteType === 'up' ? 1 : 0) + (prevVote === 'up' ? -1 : 0)),
        downvotes: Math.max(0, downvotes + (voteType === 'down' ? 1 : 0) + (prevVote === 'down' ? -1 : 0)),
      }
    }))

    try {
      // Call API to toggle vote
      const result = await discussionService.voteDiscussion(discussionId, voteType)
      // Reconcile with server's authoritative counts
      setDiscussions(prev => prev.map(d =>
        d.id === discussionId
          ? { ...d, upvotes: result.upvotes, downvotes: result.downvotes, user_vote: result.user_vote }
          : d
      ))
    } catch (error) {
      // Rollback on failure
      setDiscussions(prevDiscussions)
      console.error('Failed to vote on discussion:', error)
    }
  }

  // Sort discussions
  const sortDiscussions = (discussions) => {
    const sorted = [...discussions]
    switch (sortBy) {
      case 'hot':
        return sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      case 'new':
        return sorted.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      case 'top':
        return sorted.sort((a, b) => b.upvotes - a.upvotes)
      case 'controversial':
        return sorted.sort((a, b) => {
          const aRatio = a.downvotes / (a.upvotes + a.downvotes) || 0
          const bRatio = b.downvotes / (b.upvotes + b.downvotes) || 0
          return bRatio - aRatio
        })
      default:
        return sorted
    }
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-academic-midnight text-off-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="flex-1">
        <Header 
          title="Community Discussions" 
          icon={MessageSquare}
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
              Engage in thoughtful conversations and explore diverse perspectives
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Join discussions on important topics and share your insights with the community
            </p>
          </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <MessageSquare className="w-6 h-6 text-purple-500" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Discussions</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : (discussionStats?.total_discussions || 0)}</div>
          </div>
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-electric-blue" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Replies</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : (discussionStats?.total_replies || 0)}</div>
          </div>
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Discussions</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : (discussionStats?.active_discussions || 0)}</div>
          </div>
          <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-6 h-6 text-green-500" />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Today's Activity</span>
            </div>
            <div className="text-2xl font-bold">{dataLoading ? '...' : (discussionStats?.active_discussions || 0)}</div>
          </div>
        </div>

        {/* Reddit-style Sort Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sort by:</span>
              {['hot', 'new', 'top', 'controversial'].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors capitalize ${
                    sortBy === sort
                      ? 'bg-purple-500 text-white'
                      : darkMode 
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sort}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNewDiscussionModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>New Discussion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  category === "All"
                    ? 'bg-purple-500 text-white'
                    : darkMode 
                      ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {dataLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sortDiscussions(formattedDiscussions).length > 0 ? (
            sortDiscussions(formattedDiscussions).map((discussion) => (
            <div 
              key={discussion.id}
              className={`rounded-lg border p-6 hover:shadow-lg transition-all cursor-pointer ${
                darkMode ? 'bg-card-bg border-gray-800 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-500'
              }`}
            >
              {/* Reddit-style Voting and Content */}
              <div className="flex space-x-4">
                {/* Content Section */}
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => onProfileSelect && onProfileSelect(discussion.author)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-electric-blue text-sm ${
                        darkMode ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      {discussion.author_avatar_url ? (
                        <img src={discussion.author_avatar_url} alt={discussion.author} className="w-full h-full object-cover" />
                      ) : (
                        discussion.author.charAt(0).toUpperCase()
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <button
                          onClick={() => onProfileSelect && onProfileSelect(discussion.author)}
                          className={`text-sm font-medium hover:text-electric-blue transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {discussion.author}
                        </button>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {discussion.lastActivity}
                        </span>
                        {discussion.isPinned && (
                          <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-500 flex items-center space-x-1">
                            <Pin className="w-3 h-3" />
                            <span>Pinned</span>
                          </span>
                        )}
                        {discussion.isHot && (
                          <span className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-500 flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Hot</span>
                          </span>
                        )}
                      </div>
                      
                      <h3 
                        className="font-semibold text-lg mb-2 hover:text-purple-500 transition-colors cursor-pointer"
                        onClick={() => handleSelectDiscussion(discussion)}
                      >
                        {discussion.title}
                      </h3>
                      
                      {/* Discussion preview */}
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                        This is a preview of the discussion content. Users can click to see the full discussion with all comments and replies...
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {discussion.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className={`text-xs px-2 py-1 rounded ${
                                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <button 
                            onClick={() => handleVoteDiscussion(discussion.id, 'up')}
                            className={`flex items-center space-x-1 ${
                              discussion.userVote === 'up'
                                ? 'text-green-500'
                                : darkMode 
                                  ? 'text-gray-400 hover:text-green-500' 
                                  : 'text-gray-600 hover:text-green-500'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" fill={discussion.userVote === 'up' ? 'currentColor' : 'none'} />
                            <span>({discussion.upvotes})</span>
                          </button>
                          <button 
                            onClick={() => handleVoteDiscussion(discussion.id, 'down')}
                            className={`flex items-center space-x-1 ${
                              discussion.userVote === 'down'
                                ? 'text-red-500'
                                : darkMode 
                                  ? 'text-gray-400 hover:text-red-500' 
                                  : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" fill={discussion.userVote === 'down' ? 'currentColor' : 'none'} />
                            <span>({discussion.downvotes})</span>
                          </button>
                          <button className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            <MessageSquare className="w-4 h-4" />
                            <span>{discussion.comment_count || 0}</span>
                          </button>
                          <button className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            <Share className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleBookmark(discussion.id)}
                            className={`flex items-center space-x-1 ${
                              discussion.isBookmarked
                                ? 'text-purple-500'
                                : darkMode 
                                  ? 'text-gray-400 hover:text-purple-500' 
                                  : 'text-gray-600 hover:text-purple-500'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" fill={discussion.isBookmarked ? 'currentColor' : 'none'} />
                          </button>
                          <button className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))) : (
            <div className="text-center py-12">
              <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className="text-xl font-semibold mb-2">No discussions yet</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Be the first to start a discussion in your club!
              </p>
            </div>
          )}
        </div>
        </main>

        {/* New Discussion Modal */}
        {showNewDiscussionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`max-w-2xl w-full rounded-lg ${darkMode ? 'bg-academic-midnight' : 'bg-white'}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Create New Discussion
                  </h2>
                  <button
                    onClick={() => setShowNewDiscussionModal(false)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    ×
                  </button>
                </div>

                {createError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateDiscussion} className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter discussion title..."
                      value={newDiscussion.title}
                      onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                      className={`w-full p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Category
                    </label>
                    <select 
                      value={newDiscussion.category}
                      onChange={(e) => setNewDiscussion({...newDiscussion, category: e.target.value})}
                      className={`w-full p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                      <option value="">Select category</option>
                      {categories.slice(1).map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Content
                    </label>
                    <textarea
                      placeholder="Share your thoughts..."
                      value={newDiscussion.content}
                      onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                      className={`w-full p-2 rounded-lg resize-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="technology, debate, community"
                      value={newDiscussion.tags}
                      onChange={(e) => setNewDiscussion({...newDiscussion, tags: e.target.value})}
                      className={`w-full p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowNewDiscussionModal(false)}
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {isCreating ? 'Creating...' : 'Create Discussion'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscussionsView
