import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Bookmark, Share, Heart } from 'lucide-react'
import Header from '../components/Header'
import Login from '../components/Login'
import discussionService from '../services/discussionService'

function DiscussionDetailView({ onBack, darkMode, setDarkMode, user, isAuthenticated, onShowLogin, onProfileSelect }) {
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
  const [success, setSuccess] = useState('')

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

    const commentText = newComment
    setNewComment('')
    setIsPostingComment(true)

    // Optimistic: append a temporary comment immediately
    const tempId = `temp-${Date.now()}`
    const tempComment = {
      id: tempId,
      content: commentText,
      author: user?.username || user?.full_name || 'You',
      author_id: user?.id,
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
      created_at: new Date().toISOString(),
      replies: [],
    }
    setComments(prev => [tempComment, ...prev])

    try {
      const realComment = await discussionService.addComment(id, commentText)
      setComments(prev => prev.map(c => c.id === tempId ? realComment : c))
    } catch (error) {
      setComments(prev => prev.filter(c => c.id !== tempId))
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

    const replyText = replyContent
    setReplyContent('')
    setReplyToComment(null)

    // Optimistic: append a temporary reply under the parent comment
    const tempId = `temp-${Date.now()}`
    const tempReply = {
      id: tempId,
      content: replyText,
      author: user?.username || user?.full_name || 'You',
      author_id: user?.id,
      upvotes: 0,
      downvotes: 0,
      user_vote: null,
      created_at: new Date().toISOString(),
      replies: [],
    }
    setComments(prev => updateCommentInTree(prev, commentId, (c) => ({
      ...c,
      replies: [...(c.replies || []), tempReply],
    })))

    try {
      const realReply = await discussionService.addComment(id, replyText, commentId)
      setComments(prev => updateCommentInTree(prev, commentId, (c) => ({
        ...c,
        replies: (c.replies || []).map(r => r.id === tempId ? realReply : r),
      })))
    } catch (error) {
      setComments(prev => updateCommentInTree(prev, commentId, (c) => ({
        ...c,
        replies: (c.replies || []).filter(r => r.id !== tempId),
      })))
      console.error('Failed to post reply:', error)
    }
  }

  const handleVoteComment = async (commentId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    const prevComments = comments
    let optimisticVoteType = 'up'

    // Optimistic: flip the like state immediately
    setComments(prev => updateCommentInTree(prev, commentId, (c) => {
      const isLiked = c.user_vote === 'up'
      optimisticVoteType = isLiked ? 'down' : 'up'
      return {
        ...c,
        user_vote: isLiked ? null : 'up',
        upvotes: Math.max(0, (c.upvotes || 0) + (isLiked ? -1 : 1)),
      }
    }))

    try {
      const result = await discussionService.voteComment(commentId, optimisticVoteType)
      // Reconcile with server's authoritative counts
      setComments(prev => updateCommentInTree(prev, commentId, (c) => ({
        ...c,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        user_vote: result.user_vote,
      })))
    } catch (error) {
      // Rollback to previous state on failure
      setComments(prevComments)
      console.error('Failed to vote on comment:', error)
    }
  }

  const handleVoteDiscussion = async (discussionId, voteType) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    const prevDiscussion = currentDiscussion
    const prevVote = currentDiscussion?.user_vote

    // Optimistic: flip the vote state immediately
    setCurrentDiscussion(prev => {
      const isTogglingOff = prev?.user_vote === voteType
      const upvotes = prev?.upvotes || 0
      const downvotes = prev?.downvotes || 0

      if (isTogglingOff) {
        return {
          ...prev,
          user_vote: null,
          upvotes: Math.max(0, upvotes + (voteType === 'up' ? -1 : 0)),
          downvotes: Math.max(0, downvotes + (voteType === 'down' ? -1 : 0)),
        }
      }

      if (prevVote === voteType) {
        return prev
      }

      return {
        ...prev,
        user_vote: voteType,
        upvotes: Math.max(0, upvotes + (voteType === 'up' ? 1 : 0) + (prevVote === 'up' ? -1 : 0)),
        downvotes: Math.max(0, downvotes + (voteType === 'down' ? 1 : 0) + (prevVote === 'down' ? -1 : 0)),
      }
    })

    try {
      const result = await discussionService.voteDiscussion(id, voteType)
      // Reconcile with server's authoritative counts
      setCurrentDiscussion(prev => ({
        ...prev,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        user_vote: result.user_vote,
      }))
    } catch (error) {
      // Rollback on failure
      setCurrentDiscussion(prevDiscussion)
      console.error('Failed to vote on discussion:', error)
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    setCurrentDiscussion(prev => ({ ...prev, is_bookmarked: !prev?.is_bookmarked }))
    try {
      await discussionService.bookmarkDiscussion(id)
    } catch (error) {
      // Rollback on failure
      setCurrentDiscussion(prev => ({ ...prev, is_bookmarked: !prev?.is_bookmarked }))
      console.error('Failed to bookmark discussion:', error)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/discussions/${id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setSuccess('Link copied to clipboard!')
      setTimeout(() => setSuccess(''), 3000)
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

            {/* Success Banner */}
            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                {success}
              </div>
            )}

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
                  className={`flex items-center space-x-1 ${currentDiscussion?.is_bookmarked ? 'text-purple-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Bookmark className="w-5 h-5" fill={currentDiscussion?.is_bookmarked ? 'currentColor' : 'none'} />
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
                      setReplyToComment={setReplyToComment}
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

// Recursively update a comment (and its nested replies) by id
function updateCommentInTree(comments, commentId, updater) {
  return comments.map(c => {
    if (c.id === commentId) {
      return updater(c)
    }
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentInTree(c.replies, commentId, updater) }
    }
    return c
  })
}

// Comment Component for nested comments
function CommentComponent({ comment, darkMode, onVote, onReply, expandedComments, toggleCommentExpansion, replyToComment, setReplyToComment, replyContent, setReplyContent, handlePostReply, isAuthenticated, onShowLogin, onProfileSelect }) {
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
                  setReplyToComment={setReplyToComment}
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
