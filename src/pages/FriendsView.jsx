import { useState, useEffect } from 'react'
import { Users, Search, UserPlus, UserCheck, UserX, MessageCircle, Star } from 'lucide-react'
import Header from '../components/Header'
import friendsService from '../services/friendsService'

function FriendsView({ darkMode, setDarkMode, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const [activeTab, setActiveTab] = useState('friends') // friends, requests, search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [friends, setFriends] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadFriends = async () => {
    try {
      setLoading(true)
      const data = await friendsService.getFriends()
      setFriends(data)
    } catch (error) {
      console.error('Failed to load friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReceivedRequests = async () => {
    try {
      const data = await friendsService.getReceivedRequests()
      setReceivedRequests(data)
    } catch (error) {
      console.error('Failed to load received requests:', error)
    }
  }

  const loadSentRequests = async () => {
    try {
      const data = await friendsService.getSentRequests()
      setSentRequests(data)
    } catch (error) {
      console.error('Failed to load sent requests:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch-on-mount data loading is intentional here
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadFriends()
      loadReceivedRequests()
      loadSentRequests()
    }
  }, [isAuthenticated])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    try {
      setLoading(true)
      const data = await friendsService.searchUsers(searchQuery)
      setSearchResults(data)
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async (receiverId) => {
    setError('')
    try {
      await friendsService.sendFriendRequest(receiverId)
      // Update search results to show request sent
      setSearchResults(prev => prev.map(user => 
        user.id === receiverId ? { ...user, friend_request_sent: true } : user
      ))
      await loadSentRequests()
    } catch (error) {
      console.error('Failed to send friend request:', error)
      setError(error.response?.data?.detail || 'Failed to send friend request')
    }
  }

  const handleAcceptRequest = async (requestId) => {
    setError('')
    try {
      await friendsService.acceptFriendRequest(requestId)
      await loadReceivedRequests()
      await loadFriends()
    } catch (error) {
      console.error('Failed to accept friend request:', error)
      setError(error.response?.data?.detail || 'Failed to accept friend request')
    }
  }

  const handleRejectRequest = async (requestId) => {
    setError('')
    try {
      await friendsService.rejectFriendRequest(requestId)
      await loadReceivedRequests()
    } catch (error) {
      console.error('Failed to reject friend request:', error)
      setError(error.response?.data?.detail || 'Failed to reject friend request')
    }
  }

  const handleRemoveFriend = async (friendId) => {
    setError('')
    if (!confirm('Are you sure you want to remove this friend?')) return
    
    try {
      await friendsService.removeFriend(friendId)
      await loadFriends()
    } catch (error) {
      console.error('Failed to remove friend:', error)
      setError(error.response?.data?.detail || 'Failed to remove friend')
    }
  }

  const getAvatarIcon = () => {
    return <Star className="w-6 h-6" />
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1">
        <Header 
          title="Friends" 
          icon={Users}
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className="text-xl font-semibold mb-2">Login Required</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Please login to access the friends feature.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1">
        <Header 
          title="Friends" 
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
              Connect with fellow debaters
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Find friends, send challenges, and grow your network
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                aria-label="Dismiss error"
                className="ml-4 p-1 rounded hover:bg-red-200 transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className={`flex space-x-4 mb-8 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('friends')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'friends'
                  ? 'text-electric-blue border-b-2 border-electric-blue'
                  : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 px-4 font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? 'text-electric-blue border-b-2 border-electric-blue'
                  : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Requests
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-electric-blue border-b-2 border-electric-blue'
                  : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Find Users
            </button>
          </div>

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold">My Friends</h2>
              </div>
              <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : friends.length > 0 ? (
                  friends.map((friend) => (
                    <div key={friend.id} className="p-6 hover:bg-opacity-50 hover:bg-electric-blue/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => onProfileSelect && onProfileSelect(friend.friend_username)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-electric-blue overflow-hidden ${
                              darkMode ? 'bg-gray-800' : 'bg-gray-100'
                            }`}
                          >
                            {friend.friend_avatar_url ? (
                              <img src={friend.friend_avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getAvatarIcon()
                            )}
                          </button>
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">{friend.friend_full_name || friend.friend_username}</h3>
                              <button
                                onClick={() => onProfileSelect && onProfileSelect(friend.friend_username)}
                                className={`text-sm hover:text-electric-blue transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                              >
                                @{friend.friend_username}
                              </button>
                              <span className={`text-xs font-medium flex items-center ${
                                friend.friend_is_online ? 'text-green-500' : 'text-gray-400'
                              }`}>
                                <span className={`w-2 h-2 rounded-full mr-1 ${friend.friend_is_online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                {friend.friend_is_online ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 mt-1">
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                ELO: {friend.friend_elo_rating || 400}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}>
                            <MessageCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleRemoveFriend(friend.friend_id)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              darkMode 
                                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className="text-xl font-semibold mb-2">No friends yet</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Search for users to send friend requests and start building your network!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Received Requests */}
              {receivedRequests.length > 0 && (
                <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">Received Requests ({receivedRequests.length})</h2>
                  </div>
                  <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                    {receivedRequests.map((request) => (
                      <div key={request.id} className="p-6 hover:bg-opacity-50 hover:bg-electric-blue/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                            onClick={() => onProfileSelect && onProfileSelect(request.sender_username)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-electric-blue overflow-hidden ${
                              darkMode ? 'bg-gray-800' : 'bg-gray-100'
                            }`}
                          >
                              {request.sender_avatar_url ? (
                                <img src={request.sender_avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <UserPlus className="w-6 h-6" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{request.sender_full_name || request.sender_username}</h3>
                                <button
                                  onClick={() => onProfileSelect && onProfileSelect(request.sender_username)}
                                  className={`text-sm hover:text-electric-blue transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  @{request.sender_username}
                                </button>
                              </div>
                              {request.message && (
                                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleAcceptRequest(request.id)}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' 
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              <UserCheck className="w-4 h-4 inline mr-1" />
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(request.id)}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                darkMode 
                                  ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' 
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                            >
                              <UserX className="w-4 h-4 inline mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">Sent Requests ({sentRequests.length})</h2>
                  </div>
                  <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                    {sentRequests.map((request) => (
                      <div key={request.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-400 ${
                              darkMode ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <UserPlus className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{request.receiver_id}</h3>
                                <span className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                                  Pending
                                </span>
                              </div>
                              {request.message && (
                                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {receivedRequests.length === 0 && sentRequests.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Search for users to send friend requests!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className={`rounded-lg border p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users by username..."
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-electric-blue' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-electric-blue'
                      } focus:outline-none focus:ring-2 focus:ring-electric-blue/20`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className={`rounded-lg border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">Search Results ({searchResults.length})</h2>
                  </div>
                  <div className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                    {searchResults.map((user) => (
                      <div key={user.id} className="p-6 hover:bg-opacity-50 hover:bg-electric-blue/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                            onClick={() => onProfileSelect && onProfileSelect(user.username)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-electric-blue overflow-hidden ${
                              darkMode ? 'bg-gray-800' : 'bg-gray-100'
                            }`}
                          >
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getAvatarIcon()
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{user.full_name || user.username}</h3>
                                <button
                                  onClick={() => onProfileSelect && onProfileSelect(user.username)}
                                  className={`text-sm hover:text-electric-blue transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                  @{user.username}
                                </button>
                                <span className={`text-xs font-medium flex items-center ${
                                  user.is_online ? 'text-green-500' : 'text-gray-400'
                                }`}>
                                  <span className={`w-2 h-2 rounded-full mr-1 ${user.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {user.is_online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-6 mt-1">
                                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  ELO: {user.elo_rating || 400}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user.is_friend ? (
                              <span className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                <UserCheck className="w-4 h-4 inline mr-1" />
                                Friends
                              </span>
                            ) : user.friend_request_sent ? (
                              <span className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                                Request Sent
                              </span>
                            ) : user.friend_request_received ? (
                              <span className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                Pending Request
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleSendRequest(user.id)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  darkMode 
                                    ? 'bg-electric-blue text-white hover:bg-blue-600' 
                                    : 'bg-electric-blue text-white hover:bg-blue-600'
                                }`}
                              >
                                <UserPlus className="w-4 h-4 inline mr-1" />
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !loading && (
                <div className="text-center py-12">
                  <Search className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Try searching for a different username
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
    </div>
  )
}

export default FriendsView
