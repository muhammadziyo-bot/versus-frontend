import { useState, useEffect, useRef } from 'react'
import { Sword, Users, MessageSquare, Clock, Trophy, Send, Play, User, Timer, ArrowLeft, Search, Shuffle, Users2, Loader2 } from 'lucide-react'
import battleService from '../services/battleService'
import websocketService from '../services/websocketService'
import authService from '../services/authService'
import matchmakingService from '../services/matchmakingService'
import debateService from '../services/debateService'
import { useAuth } from '../contexts/AuthContext'

const BattleView = ({ debateId, battleRoomId, onBack, darkMode }) => {
  const { user } = useAuth()
  const [battleRoom, setBattleRoom] = useState(null)
  const [rounds, setRounds] = useState([])
  const [votes, setVotes] = useState([])
  const [messages, setMessages] = useState([])
  const [currentRound, setCurrentRound] = useState(1)
  const [wsConnected, setWsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCreateBattle, setShowCreateBattle] = useState(true)
  const [opponent, setOpponent] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [queueStatus, setQueueStatus] = useState(null)
  const [matchingError, setMatchingError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [showRandomMatching, setShowRandomMatching] = useState(false)
  const [isLeavingQueue, setIsLeavingQueue] = useState(false)
  const [opponentUsername, setOpponentUsername] = useState('')
  const [chatMessage, setChatMessage] = useState('')
  const [argumentText, setArgumentText] = useState('')
  const [debateTitle, setDebateTitle] = useState('')
  const [showVoting, setShowVoting] = useState(false)
  const [voteData, setVoteData] = useState({
    side: '',
    reasoning: '',
    confidence: 5,
    argument_quality: 5,
    clarity: 5,
    persuasiveness: 5,
    evidence: 5
  })
  
  // Random matching states
  const [matchingMode, setMatchingMode] = useState('manual') // 'manual' or 'random'
  
  const messagesEndRef = useRef(null)
  const argumentRef = useRef(null)

  useEffect(() => {
    if (battleRoomId) {
      // Join existing battle room
      loadExistingBattleRoom(battleRoomId)
    } else if (debateId) {
      // Create new battle from debate
      loadBattleData()
    }

    return () => {
      // Leave matchmaking queue if we're searching
      cleanupMatchmaking()

      if (battleRoom) {
        websocketService.disconnectFromBattle(battleRoom.id)
      }
    }
  }, [debateId, battleRoomId, isSearching])

  // Handle page visibility change (user switching tabs/closing browser)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSearching) {
        console.log('Page hidden, leaving matchmaking queue...')
        cleanupMatchmaking()
      }
    }

    const handleBeforeUnload = (e) => {
      if (isSearching) {
        console.log('Page unloading, leaving matchmaking queue...')
        // Use sendBeacon for reliable cleanup during page unload
        const token = localStorage.getItem('access_token')
        if (token) {
          navigator.sendBeacon(
            'http://localhost:8000/api/matchmaking/leave',
            new Blob(JSON.stringify({}), {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          )
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isSearching])

  const cleanupMatchmaking = async () => {
    if (isSearching && !isLeavingQueue) {
      setIsLeavingQueue(true)
      try {
        await matchmakingService.leaveMatchmaking()
        console.log('Left matchmaking queue')
      } catch (err) {
        console.error('Failed to leave queue:', err)
      } finally {
        setIsSearching(false)
        setQueueStatus(null)
        setIsLeavingQueue(false)
      }
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadBattleData = async () => {
    try {
      setLoading(true)
      setError(null)
      setShowCreateBattle(true)

    } catch (err) {
      setError('Failed to load battle data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExistingBattleRoom = async (roomId) => {
    try {
      setLoading(true)
      setError(null)
      setShowCreateBattle(false)

      // Load battle room details (now includes user information)
      const battle = await battleService.getBattleRoom(roomId)
      setBattleRoom(battle)

      // Load debate title
      if (battle.debate_id) {
        try {
          const debate = await debateService.getDebateById(battle.debate_id)
          setDebateTitle(debate.title || 'Unknown Topic')
        } catch (err) {
          console.error('Failed to load debate title:', err)
          setDebateTitle('Unknown Topic')
        }
      }

      // Connect to WebSocket
      await connectToBattle(roomId)

      // Load rounds and votes
      await loadBattleDetails(roomId)

    } catch (err) {
      setError('Failed to load battle room')
      console.error(err)
      setShowCreateBattle(true)
    } finally {
      setLoading(false)
    }
  }

  const createBattle = async () => {
    if (matchingMode === 'manual' && !opponentUsername) {
      setMatchingError('Please enter an opponent username')
      return
    }

    try {
      setMatchingError('')
      
      if (matchingMode === 'manual') {
        // Validate debateId for manual battle as well
        const parsedDebateId = debateId ? parseInt(debateId) : NaN
        if (!debateId || isNaN(parsedDebateId)) {
          console.error('Invalid debateId for manual battle:', debateId)
          setMatchingError('Invalid debate ID. Please navigate to a valid debate topic.')
          return
        }

        // Load debate title
        try {
          const debate = await debateService.getDebateById(parsedDebateId)
          setDebateTitle(debate.title || 'Unknown Topic')
        } catch (err) {
          console.error('Failed to load debate title:', err)
          setDebateTitle('Unknown Topic')
        }

        // Manual battle creation
        const userResponse = await battleService.findUserByUsername(opponentUsername)
        const opponentId = userResponse.id
        
        const battleData = {
          debate_id: parsedDebateId,
          opponent_id: opponentId
        }
        
        const battle = await battleService.createBattleRoom(battleData)
        setBattleRoom(battle)
        setShowCreateBattle(false)
        
        await connectToBattle(battle.id)
        await loadBattleDetails(battle.id)
      } else {
        // Random matching
        await startRandomMatching()
      }
      
    } catch (err) {
      setMatchingError(err.message || 'Failed to create battle room')
      console.error(err)
    }
  }

  const startRandomMatching = async () => {
    setIsSearching(true)
    setMatchingError('')
    
    // Validate debateId before attempting matchmaking
    const parsedDebateId = debateId ? parseInt(debateId) : NaN
    if (!debateId || isNaN(parsedDebateId)) {
      console.error('Invalid debateId:', debateId)
      setMatchingError('Invalid debate ID. Please navigate to a valid debate topic.')
      setIsSearching(false)
      return
    }
    
    // Load debate title
    try {
      const debate = await debateService.getDebateById(parsedDebateId)
      setDebateTitle(debate.title || 'Unknown Topic')
    } catch (err) {
      console.error('Failed to load debate title:', err)
      setDebateTitle('Unknown Topic')
    }
    
    // Validate token before attempting matchmaking
    const token = localStorage.getItem('access_token')
    console.log('Token for matchmaking:', token ? `Bearer ${token.substring(0, 20)}...` : 'No token!')
    
    if (!token) {
      setMatchingError('Please login to join matchmaking')
      setIsSearching(false)
      return
    }

    // Validate token is still valid
    try {
      const isValid = await authService.validateAndRefreshToken()
      if (!isValid) {
        setMatchingError('Your session has expired. Please login again.')
        setIsSearching(false)
        return
      }
      console.log('Token validated successfully')
    } catch (error) {
      console.error('Token validation failed:', error)
      setMatchingError('Authentication error. Please login again.')
      setIsSearching(false)
      return
    }
    
    try {
      // Join matchmaking queue
      const data = await matchmakingService.joinMatchmaking(
        parsedDebateId,
        {
          skill_level: 'intermediate', // Could be user preference
          max_rounds: 3,
          time_limit: 300
        }
      )
      
      console.log('Successfully joined matchmaking:', data)
      setQueueStatus(data)
      
      // Start polling for match status
      pollForMatch()
    } catch (err) {
      console.error('Matchmaking error:', err)
      setMatchingError(err.detail || err.message || 'Failed to start random matching')
      setIsSearching(false)
    }
  }

  const pollForMatch = async () => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await matchmakingService.getQueueStatus()
        setQueueStatus(data)
        
        if (data.match_found) {
          clearInterval(pollInterval)
          setIsSearching(false)
          
          // Connect to the found battle
          setBattleRoom(data.battle)
          setShowCreateBattle(false)
          
          await connectToBattle(data.battle.id)
          await loadBattleDetails(data.battle.id)
        }
      } catch (err) {
        console.error('Error polling match status:', err)
        if (err.detail?.includes('401') || err.detail?.includes('Unauthorized')) {
          clearInterval(pollInterval)
          setIsSearching(false)
          setMatchingError('Authentication lost. Please login again.')
        }
      }
    }, 2000) // Poll every 2 seconds
    
    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isSearching) {
        setIsSearching(false)
        setMatchingError('Matchmaking timeout. Please try again.')
      }
    }, 300000)
  }

  const searchUsers = async (query) => {
    if (!query) {
      setSearchResults([])
      return
    }
    
    try {
      const users = await matchmakingService.searchUsers(query)
      setSearchResults(users.filter(u => u.id !== user?.id))
    } catch (err) {
      console.error('Error searching users:', err)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      const users = await matchmakingService.getOnlineUsers()
      setAvailableUsers(users.filter(u => u.id !== user?.id))
    } catch (err) {
      console.error('Error loading available users:', err)
    }
  }

  const cancelMatching = async () => {
    if (!isLeavingQueue) {
      setIsLeavingQueue(true)
      try {
        await matchmakingService.leaveMatchmaking()
        console.log('Successfully left matchmaking queue')
        setIsSearching(false)
        setQueueStatus(null)
        setMatchingError('')
      } catch (err) {
        console.error('Error cancelling matchmaking:', err)
        setMatchingError(err.detail || err.message || 'Failed to cancel matchmaking')
      } finally {
        setIsLeavingQueue(false)
      }
    }
  }

  const connectToBattle = async (battleId) => {
    try {
      const token = localStorage.getItem('access_token')
      await websocketService.connectToBattle(battleId, token)
      
      websocketService.addEventListener(battleId, handleWebSocketMessage)
      setWsConnected(true)
      
    } catch (err) {
      console.error('Failed to connect to battle WebSocket:', err)
      setError('Failed to connect to real-time battle')
    }
  }

  const handleWebSocketMessage = (data) => {
    console.log('WebSocket message:', data)
    
    switch (data.type) {
      case 'battle_state':
        setBattleRoom(data.data.battle)
        setRounds(data.data.rounds || [])
        setVotes(data.data.votes || [])
        setCurrentRound(data.data.battle.current_round)
        break
        
      case 'chat':
        setMessages(prev => [...prev, data.data])
        break
        
      case 'argument_submitted':
        setRounds(prev => prev.map(round => 
          round.round_number === data.data.round_number 
            ? { ...round, [`${data.data.side}_argument`]: data.data.argument }
            : round
        ))
        break
        
      case 'battle_started':
        setBattleRoom(prev => ({ ...prev, ...data.data }))
        break
        
      case 'battle_completed':
        setBattleRoom(prev => ({ ...prev, ...data.data }))
        setShowVoting(true)
        break
        
      case 'error':
        setError(data.data.message)
        break
        
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const loadBattleDetails = async (battleId) => {
    try {
      const [battle, battleRounds, battleVotes] = await Promise.all([
        battleService.getBattleRoom(battleId),
        battleService.getBattleRounds(battleId),
        battleService.getBattleVotes(battleId)
      ])
      
      setBattleRoom(battle)
      setRounds(battleRounds)
      setVotes(battleVotes)
      setCurrentRound(battle.current_round)
      
    } catch (err) {
      console.error('Failed to load battle details:', err)
    }
  }

  const startBattle = () => {
    if (battleRoom) {
      websocketService.startBattle(battleRoom.id)
    }
  }

  const sendChatMessage = () => {
    if (chatMessage.trim() && battleRoom) {
      websocketService.sendChatMessage(battleRoom.id, chatMessage.trim())
      setChatMessage('')
    }
  }

  const submitArgument = () => {
    if (argumentText.trim() && battleRoom) {
      websocketService.submitArgument(battleRoom.id, currentRound, argumentText.trim())
      setArgumentText('')
    }
  }

  const castVote = async () => {
    try {
      await battleService.castVote(battleRoom.id, voteData)
      setShowVoting(false)
      await loadBattleDetails(battleRoom.id)
    } catch (err) {
      setError('Failed to cast vote')
      console.error(err)
    }
  }

  const getUserSide = () => {
    if (!battleRoom || !user) return null
    return user.id === battleRoom.pro_user_id ? 'pro' : 'con'
  }

  const getUserName = (userId) => {
    if (!battleRoom) return 'Unknown'
    if (userId === battleRoom.pro_user_id && battleRoom.pro_user) {
      return battleRoom.pro_user.username
    }
    if (userId === battleRoom.con_user_id && battleRoom.con_user) {
      return battleRoom.con_user.username
    }
    return `User ${userId}`
  }

  const isOpponentConnected = () => {
    // Check if opponent is connected via WebSocket
    // This would be determined by WebSocket presence
    // For now, we'll check if both users are present and battle is active
    return battleRoom && battleRoom.status === 'active' && wsConnected
  }

  const getCurrentRound = () => {
    return rounds.find(r => r.round_number === currentRound)
  }

  const canSubmitArgument = () => {
    const round = getCurrentRound()
    if (!round || !battleRoom) return false
    
    const userSide = getUserSide()
    const hasSubmitted = round[`${userSide}_argument`]
    
    return battleRoom.status === 'active' && round.status === 'active' && !hasSubmitted
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading battle...</div>
      </div>
    )
  }

  if (showCreateBattle) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${darkMode ? 'bg-card-bg' : 'bg-white'} rounded-lg shadow-md`}>
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className={`mr-4 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold flex items-center">
            <Sword className="w-6 h-6 mr-2" />
            Battle Arena
          </h2>
        </div>
        
        {/* Matching Mode Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Choose Battle Type</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMatchingMode('manual')}
              className={`p-4 rounded-lg border-2 transition-all ${
                matchingMode === 'manual'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Manual Battle</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Challenge specific user</div>
            </button>
            
            <button
              onClick={() => setMatchingMode('random')}
              className={`p-4 rounded-lg border-2 transition-all ${
                matchingMode === 'random'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <Shuffle className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Random Battle</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Match with anyone online</div>
            </button>
          </div>
        </div>

        {/* Manual Battle Section */}
        {matchingMode === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Opponent Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={opponentUsername}
                  onChange={(e) => {
                    setOpponentUsername(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  className={`w-full p-2 pr-10 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Enter opponent username"
                />
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className={`mt-2 border rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                  {searchResults.map((searchUser) => (
                    <button
                      key={searchUser.id}
                      onClick={() => {
                        setOpponentUsername(searchUser.username)
                        setSearchResults([])
                      }}
                      className={`w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between`}
                    >
                      <div>
                        <div className="font-medium">{searchUser.username}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        ELO: {searchUser.elo_rating || 400}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="text-sm">
                <strong>Manual Battle:</strong> Challenge a specific user to a debate on this topic.
              </div>
            </div>
          </div>
        )}

        {/* Random Battle Section */}
        {matchingMode === 'random' && (
          <div className="space-y-4">
            {isSearching ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold mb-2">Finding Opponent...</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {queueStatus && (
                    <div>
                      <div>Queue Position: {queueStatus.position || 'Calculating...'}</div>
                      <div>Estimated Wait: {queueStatus.estimated_wait_time || 'Calculating...'}</div>
                      <div>Users Waiting: {queueStatus.users_waiting || 0}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={cancelMatching}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Cancel Search
                </button>
              </div>
            ) : (
              <div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Users2 className="w-5 h-5 mr-2" />
                    Random Matching
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>• We'll find you an opponent with similar skill level</div>
                    <div>• Matches are based on ELO rating and preferences</div>
                    <div>• Average wait time: 30-60 seconds</div>
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="text-sm">
                    <strong>Ready to battle?</strong> Click below to join the matchmaking queue and we'll find you the perfect opponent!
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {matchingError && (
          <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {matchingError}
          </div>
        )}

        {/* Action Buttons */}
        {!isSearching && (
          <div className="flex space-x-3">
            <button
              onClick={createBattle}
              disabled={matchingMode === 'manual' && !opponentUsername}
              className={`flex-1 p-3 rounded-lg font-medium transition-colors ${
                matchingMode === 'manual' && !opponentUsername
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : matchingMode === 'manual'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {matchingMode === 'manual' ? 'Challenge User' : 'Find Random Battle'}
            </button>
            
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!battleRoom) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No battle room found</div>
        <button
          onClick={onBack}
          className="mt-4 text-blue-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Battle Header */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className={`mr-4 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Sword className="w-6 h-6 mr-2" />
                Battle Room #{battleRoom.id}
              </h1>
              {debateTitle && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Topic: {debateTitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </div>
            {battleRoom.status === 'waiting' && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isOpponentConnected() ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isOpponentConnected() ? 'Opponent Ready' : 'Waiting for Opponent'}
              </div>
            )}
            
            {battleRoom.status === 'waiting' && (
              <button
                onClick={startBattle}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Battle
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Pro User</div>
            <div className="font-medium">{getUserName(battleRoom.pro_user_id)}</div>
            {getUserSide() === 'pro' && <div className="text-xs text-blue-500">You</div>}
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium capitalize">{battleRoom.status}</div>
            <div className="text-xs text-gray-500">Round {currentRound}/{battleRoom.max_rounds}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Con User</div>
            <div className="font-medium">{getUserName(battleRoom.con_user_id)}</div>
            {getUserSide() === 'con' && <div className="text-xs text-blue-500">You</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battle Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Round */}
          {battleRoom.status === 'active' && (
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-4">Round {currentRound}</h3>
              
              <div className="space-y-4">
                {/* Pro Argument */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="font-medium text-blue-700 mb-2">Pro Argument</div>
                  {getCurrentRound()?.pro_argument ? (
                    <div className="text-gray-700">
                      {getCurrentRound().pro_argument}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">Argument not submitted yet</div>
                  )}
                </div>
                
                {/* Con Argument */}
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="font-medium text-red-700 mb-2">Con Argument</div>
                  {getCurrentRound()?.con_argument ? (
                    <div className="text-gray-700">
                      {getCurrentRound().con_argument}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">Argument not submitted yet</div>
                  )}
                </div>
              </div>
              
              {/* Argument Submission */}
              {canSubmitArgument() && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium mb-2">Submit Your Argument ({getUserSide()})</h4>
                  <textarea
                    ref={argumentRef}
                    value={argumentText}
                    onChange={(e) => setArgumentText(e.target.value)}
                    className={`w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    rows="4"
                    placeholder="Enter your argument for this round..."
                  />
                  <button
                    onClick={submitArgument}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Submit Argument
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Voting */}
          {showVoting && battleRoom.status === 'completed' && (
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Cast Your Vote
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Who Won?
                  </label>
                  <select
                    value={voteData.side}
                    onChange={(e) => setVoteData(prev => ({ ...prev, side: e.target.value }))}
                    className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="">Select winner</option>
                    <option value="pro">Pro</option>
                    <option value="con">Con</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reasoning
                  </label>
                  <textarea
                    value={voteData.reasoning}
                    onChange={(e) => setVoteData(prev => ({ ...prev, reasoning: e.target.value }))}
                    className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    rows="3"
                    placeholder="Explain your reasoning..."
                  />
                </div>
                
                <button
                  onClick={castVote}
                  className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                >
                  Cast Vote
                </button>
              </div>
            </div>
          )}

          {/* Battle Results */}
          {battleRoom.status === 'completed' && battleRoom.winner_side && (
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Battle Results
              </h3>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  {battleRoom.winner_side === 'draw' ? 'Draw!' : `${battleRoom.winner_side.toUpperCase()} Wins!`}
                </div>
                <div className="text-gray-600">
                  Battle completed
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className={`rounded-lg shadow-md p-6 h-96 flex flex-col ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Battle Chat
          </h3>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {messages.map((message, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium">{getUserName(message.user_id) || 'User'}:</div>
                <div className="text-gray-700">{message.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              className={`flex-1 p-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Type a message..."
            />
            <button
              onClick={sendChatMessage}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

export default BattleView
