import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ThumbsDown, Users, Reply, Bookmark, Share, Heart, Flag } from 'lucide-react'
import Header from '../components/Header'
import Login from '../components/Login'
import discussionService from '../services/discussionService'

function DiscussionDetailView({ onBack, darkMode, setDarkMode, onNavigate, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const { id } = useParams()
  const [comments, setComments] = useState([])
  const [currentDiscussion, setCurrentDiscussion] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [replyToComment, setReplyToComment] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedComments, setExpandedComments] = useState(new Set())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch discussion details and comments
  useEffect(() => {
    const fetchDiscussionDetails = async () => {
      if (!id) return
      
      setLoading(true)
      setError(null)
      
      try {
        const discussionDetail = await discussionService.getDiscussionById(id)
        setCurrentDiscussion(discussionDetail)
        setComments(discussionDetail.comments || [])
      } catch (err) {
        console.error('Failed to fetch discussion details:', err)
        setError('Failed to load discussion details')
      } finally {
        setLoading(false)
      }
    }

    fetchDiscussionDetails()
  }, [id])

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!newComment.trim()) return

    setIsPostingComment(true)

    try {
      await discussionService.addComment(id, newComment)
      setNewComment('')
      
      // Refresh comments
      const discussionDetail = await discussionService.getDiscussionById(id)
      setComments(discussionDetail.comments || [])
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsPostingComment(false)
    }
  }

  const handlePostReply = async (commentId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    if (!replyContent.trim()) return

    try {
      await discussionService.addComment(id, replyContent, commentId)
      setReplyContent('')
      setReplyToComment(null)
      
      // Refresh comments
      const discussionDetail = await discussionService.getDiscussionById(id)
      setComments(discussionDetail.comments || [])
    } catch (error) {
      console.error('Failed to post reply:', error)
    }
  }

  const handleVoteComment = async (commentId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      // If already liked, unlike by voting 'down' to remove the vote
      const comment = comments.find(c => c.id === commentId)
      const actualVoteType = comment?.user_vote === 'up' ? 'down' : 'up'
      
      await discussionService.voteComment(commentId, actualVoteType)
      
      // Refresh comments to get updated vote state
      const discussionDetail = await discussionService.getDiscussionById(id)
      setComments(discussionDetail.comments || [])
    } catch (error) {
      console.error('Failed to vote on comment:', error)
    }
  }

  const handleVoteDiscussion = async (discussionId, voteType) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      // The API returns the updated discussion with correct vote counts
      const updatedDiscussion = await discussionService.voteDiscussion(id, voteType)
      setCurrentDiscussion(updatedDiscussion)
    } catch (error) {
      console.error('Failed to vote on discussion:', error)
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      await discussionService.bookmarkDiscussion(id)
      // Refresh discussion data
      const discussionDetail = await discussionService.getDiscussionById(id)
      setCurrentDiscussion(discussionDetail)
    } catch (error) {
      console.error('Failed to bookmark discussion:', error)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/discussions/${id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const toggleCommentExpansion = (commentId) => {
    setExpandedComments(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId)
      } else {
        newExpanded.add(commentId)
      }
      return newExpanded
    })
  }

  if (loading) {
    return (
      <div className="flex-1">
        <Header 
          title="Loading Discussion..." 
          icon={MessageSquare}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1">
        <Header 
          title="Error" 
          icon={MessageSquare}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1">
        <Header 
          title={currentDiscussion?.title || "Discussion"} 
          icon={MessageSquare}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />

          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <button
              onClick={onBack}
              className={`mb-6 px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ← Back to Discussions
            </button>

            {/* Discussion Content */}
            <div className={`rounded-lg shadow-md p-6 mb-8 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              {/* Discussion Title */}
              <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentDiscussion?.title || 'Discussion Title'}
              </h1>
              
              <div className="flex items-start space-x-3 mb-4">
                <button
                  onClick={() => onProfileSelect && onProfileSelect(currentDiscussion?.author)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden text-electric-blue text-lg font-bold ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}
                >
                  {currentDiscussion?.author_avatar_url ? (
                    <img src={currentDiscussion?.author_avatar_url} alt={currentDiscussion?.author} className="w-full h-full object-cover" />
                  ) : (
                    currentDiscussion?.author?.charAt(0).toUpperCase() || 'U'
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={() => onProfileSelect && onProfileSelect(currentDiscussion?.author)}
                      className={`font-medium hover:text-electric-blue transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {currentDiscussion?.author || 'Anonymous'}
                    </button>
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {currentDiscussion?.created_at ? new Date(currentDiscussion.created_at).toLocaleString() : 'Recently'}
                    </span>
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed text-lg`}>
                    {currentDiscussion?.content || ''}
                  </p>
                  
                  {/* Tags */}
                  {currentDiscussion?.tags && currentDiscussion?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {currentDiscussion?.tags?.map((tag, index) => (
                        <span 
                          key={index}
                          className={`text-xs px-3 py-1 rounded-full ${
                            darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Discussion Actions */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleVoteDiscussion(currentDiscussion?.id, 'up')}
                    className={`flex items-center space-x-1 ${
                      currentDiscussion?.user_vote === 'up'
                        ? 'text-green-500'
                        : darkMode 
                          ? 'text-gray-400 hover:text-green-500' 
                          : 'text-gray-600 hover:text-green-500'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span>{currentDiscussion?.upvotes ?? 0}</span>
                  </button>
                  <button 
                    onClick={() => handleVoteDiscussion(currentDiscussion?.id, 'down')}
                    className={`flex items-center space-x-1 ${
                      currentDiscussion?.user_vote === 'down'
                        ? 'text-red-500'
                        : darkMode 
                          ? 'text-gray-400 hover:text-red-500' 
                          : 'text-gray-600 hover:text-red-500'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span>{currentDiscussion?.downvotes ?? 0}</span>
                  </button>
                </div>
                <div className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <MessageSquare className="w-5 h-5" />
                  <span>{comments.length} comments</span>
                </div>
                <button 
                  onClick={handleShare}
                  className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Share className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleBookmark}
                  className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Comments ({comments.length})
              </h3>
              
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentComponent
                      key={comment.id}
                      comment={comment}
                      darkMode={darkMode}
                      onVote={handleVoteComment}
                      onReply={(commentId) => setReplyToComment(commentId)}
                      expandedComments={expandedComments}
                      toggleCommentExpansion={toggleCommentExpansion}
                      replyToComment={replyToComment}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      handlePostReply={handlePostReply}
                      isAuthenticated={isAuthenticated}
                      onShowLogin={() => setShowLoginModal(true)}
                      onProfileSelect={onProfileSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}

              {/* Add Comment */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handlePostComment}>
                  <textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className={`w-full p-4 rounded-lg resize-none ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    rows={4}
                  />
                  <div className="flex justify-end mt-3">
                    <button 
                      type="submit"
                      disabled={isPostingComment}
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {isPostingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
      </div>

      {/* Login Modal */}
      {showLoginModal && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-lg p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-card-bg border border-gray-800' : 'bg-white'} transition-colors duration-300 relative`}>
            <button onClick={() => setShowLoginModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors z-10`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Login darkMode={darkMode} onToggleMode={() => setDarkMode(!darkMode)} />
          </div>
        </div>
      )}
    </>
  )
}

// Comment Component for nested comments
function CommentComponent({ comment, darkMode, onVote, onReply, expandedComments, toggleCommentExpansion, replyToComment, replyContent, setReplyContent, handlePostReply, isAuthenticated, onShowLogin, onProfileSelect }) {
  const isExpanded = expandedComments.has(comment.id)
  const hasReplies = comment.replies && comment.replies.length > 0
  const isReplying = replyToComment === comment.id

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onProfileSelect && onProfileSelect(comment.author)}
          className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-electric-blue text-sm font-bold ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          {comment.author_avatar_url ? (
            <img src={comment.author_avatar_url} alt={comment.author} className="w-full h-full object-cover" />
          ) : (
            comment.author?.charAt(0).toUpperCase() || 'U'
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={() => onProfileSelect && onProfileSelect(comment.author)}
              className={`font-medium hover:text-electric-blue transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {comment.author || 'Anonymous'}
            </button>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Recently'}
            </span>
          </div>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
            {comment.content}
          </p>
          
          <div className="flex items-center space-x-4 text-sm">
            <button 
              onClick={() => onVote(comment.id)}
              className={`flex items-center space-x-1 ${
                comment.user_vote === 'up'
                  ? 'text-red-500'
                  : darkMode 
                    ? 'text-gray-400 hover:text-red-500' 
                    : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart 
                className="w-4 h-4" 
                fill={comment.user_vote === 'up' ? 'red' : 'none'} 
                color={comment.user_vote === 'up' ? 'red' : 'currentColor'}
              />
              <span>{comment.upvotes || 0}</span>
            </button>
            <button 
              onClick={() => onReply(comment.id)}
              className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
            {hasReplies && (
              <button 
                onClick={() => toggleCommentExpansion(comment.id)}
                className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span>{isExpanded ? 'Hide' : 'Show'} {comment.replies.length} replies</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className={`w-full p-3 rounded-lg resize-none text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                rows={2}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setReplyToComment(null)
                    setReplyContent('')
                  }}
                  className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePostReply(comment.id)}
                  className={`px-3 py-1 rounded text-sm bg-purple-500 text-white hover:bg-purple-600`}
                >
                  Reply
                </button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {hasReplies && isExpanded && (
            <div className="mt-4 ml-8 space-y-3">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  darkMode={darkMode}
                  onVote={onVote}
                  onReply={onReply}
                  expandedComments={expandedComments}
                  toggleCommentExpansion={toggleCommentExpansion}
                  replyToComment={replyToComment}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  handlePostReply={handlePostReply}
                  isAuthenticated={isAuthenticated}
                  onShowLogin={onShowLogin}
                  onProfileSelect={onProfileSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiscussionDetailView
