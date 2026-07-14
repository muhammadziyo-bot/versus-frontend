import { useState, useEffect, useRef } from 'react'
import { Sword, Users, MessageSquare, Clock, Trophy, Send, Play, User, Timer, ArrowLeft, Search, Shuffle, Users2, Loader2 } from 'lucide-react'
import battleService from '../services/battleService'
import websocketService from '../services/websocketService'
import authService from '../services/authService'
import matchmakingService from '../services/matchmakingService'
import debateService from '../services/debateService'
import { useAuth } from '../contexts/AuthContext'
import BattleResults from '../components/BattleResults'

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
  const [showAIResults, setShowAIResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showRoundHistory, setShowRoundHistory] = useState(false)
  const [showSideSelection, setShowSideSelection] = useState(false)
  const [selectedSide, setSelectedSide] = useState(null)
  
  // Use ref to store current user data that can be updated immediately
  const currentUserRef = useRef(user)
  
  // Update ref whenever user changes
  useEffect(() => {
    currentUserRef.current = user
    console.log('User ref updated:', user)
  }, [user])
  
  // Random matching states
  const [matchingMode, setMatchingMode] = useState('manual') // 'manual' or 'random'
  
  const messagesEndRef = useRef(null)
  const argumentRef = useRef(null)
  const timerRef = useRef(null)

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
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [debateId, battleRoomId, isSearching])

  // Timer effect
  useEffect(() => {
    if (battleRoom && battleRoom.status === 'active' && battleRoom.round_ends_at) {
      const updateTimer = () => {
        const now = new Date()
        const endsAt = new Date(battleRoom.round_ends_at)
        const remaining = Math.max(0, Math.floor((endsAt - now) / 1000))
        setTimeRemaining(remaining)
      }
      
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    } else {
      setTimeRemaining(0)
    }
  }, [battleRoom])

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

      // Force user refresh by calling /auth/me endpoint directly
      let freshUserData = user
      try {
        const token = localStorage.getItem('access_token')
        console.log('=== USER REFRESH ===')
        console.log('Attempting to refresh user with token:', token ? 'exists' : 'missing')
        console.log('Current user in state before refresh:', user)
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          freshUserData = await response.json()
          console.log('Successfully refreshed user data:', freshUserData)
          updateUser(freshUserData)
          console.log('Updated user in auth context')
        } else {
          console.error('Failed to refresh user - status:', response.status)
        }
      } catch (err) {
        console.error('Failed to refresh user data:', err)
      }

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

      // Load rounds and votes - pass fresh user data
      await loadBattleDetails(roomId, freshUserData)

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
      
      // Refresh current user data to ensure we have the correct user ID
      try {
        const freshUser = await authService.getCurrentUser()
        updateUser(freshUser)
        console.log('Refreshed user data before battle creation:', freshUser)
      } catch (err) {
        console.error('Failed to refresh user data:', err)
      }
      
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
        
        console.log('=== MANUAL BATTLE CREATION ===')
        console.log('Current User ID:', user?.id, typeof user?.id)
        console.log('Opponent ID:', opponentId, typeof opponentId)
        console.log('==============================')
        
        const battleData = {
          debate_id: parsedDebateId,
          opponent_id: opponentId
        }
        
        const battle = await battleService.createBattleRoom(battleData)
        console.log('Created Battle Room:', battle)
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
    
    // Refresh current user data to ensure we have the correct user ID
    try {
      const freshUser = await authService.getCurrentUser()
      updateUser(freshUser)
      console.log('Refreshed user data before matchmaking:', freshUser)
    } catch (err) {
      console.error('Failed to refresh user data:', err)
    }
    
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
          
          // Load the full battle room from database to get proper user assignments
          const battleId = data.battle.battle_id || data.battle.id
          const battle = await battleService.getBattleRoom(battleId)
          setBattleRoom(battle)
          setShowCreateBattle(false)
          
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
          
          await connectToBattle(battleId)
          await loadBattleDetails(battleId)
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
        // Load debate title if debate_id is present
        if (data.data.battle.debate_id && !debateTitle) {
          loadDebateTitle(data.data.battle.debate_id)
        }
        console.log('Battle state updated:', data.data.battle)
        break
        
      case 'message_history':
        setMessages(data.data.messages || [])
        break
        
      case 'chat':
        setMessages(prev => [...prev, data.data])
        break
        
      case 'argument_submitted':
        console.log('Argument submitted event received:', data.data)
        setRounds(prev => prev.map(round => 
          round.round_number === data.data.round_number 
            ? { ...round, [`${data.data.side}_argument`]: data.data.argument }
            : round
        ))
        // Refresh battle state to get updated round status
        if (battleRoom) {
          loadBattleDetails(battleRoom.id)
        }
        break
        
      case 'round_completed':
        setRounds(prev => prev.map(round => 
          round.round_number === data.data.round_number 
            ? { ...round, status: 'completed' }
            : round
        ))
        if (data.data.next_round) {
          setCurrentRound(data.data.next_round)
        }
        break
        
      case 'battle_started':
        setBattleRoom(prev => ({ ...prev, ...data.data }))
        // Refresh battle details to get updated round status
        if (battleRoom) {
          loadBattleDetails(battleRoom.id)
        }
        // Hide side selection when battle starts
        setShowSideSelection(false)
        break
        
      case 'side_selected':
        setBattleRoom(prev => ({ ...prev, ...data.data }))
        break
        
      case 'battle_completed':
        setBattleRoom(prev => ({ ...prev, ...data.data }))
        setShowVoting(true)
        setShowAIResults(true)
        break
        
      case 'error':
        setError(data.data.message)
        console.error('WebSocket error:', data.data.message)
        break
        
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const loadBattleDetails = async (battleId, userData = user) => {
    try {
      const [battle, battleRounds, battleVotes] = await Promise.all([
        battleService.getBattleRoom(battleId),
        battleService.getBattleRounds(battleId),
        battleService.getBattleVotes(battleId)
      ])
      
      console.log('=== BATTLE DETAILS LOADED ===')
      console.log('Battle Room:', battle)
      console.log('Current User (from param):', userData)
      console.log('User ID type:', typeof userData?.id, userData?.id)
      console.log('Pro User ID type:', typeof battle?.pro_user_id, battle?.pro_user_id)
      console.log('Con User ID type:', typeof battle?.con_user_id, battle?.con_user_id)
      console.log('Pro User:', battle?.pro_user)
      console.log('Con User:', battle?.con_user)
      console.log('============================')
      
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
      console.log('Sending chat message:', chatMessage.trim())
      websocketService.sendChatMessage(battleRoom.id, chatMessage.trim())
      // Optimistically add message to UI
      setMessages(prev => [...prev, {
        user_id: user?.id,
        username: user?.username,
        message: chatMessage.trim(),
        timestamp: new Date().toISOString()
      }])
      setChatMessage('')
    }
  }

  const submitArgument = () => {
    if (argumentText.trim() && battleRoom) {
      console.log('Submitting argument for round', currentRound, ':', argumentText.trim())
      websocketService.submitArgument(battleRoom.id, currentRound, argumentText.trim())
      setArgumentText('')
      // Optimistically update UI - will be refreshed by WebSocket event
      setError(null)
    } else {
      console.error('Cannot submit argument:', { hasText: !!argumentText.trim(), hasBattle: !!battleRoom })
      setError('Please enter an argument before submitting')
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

  const getUserSide = (userData = currentUserRef.current) => {
    if (!battleRoom || !userData) {
      console.log('getUserSide: missing battleRoom or user', { battleRoom: !!battleRoom, user: !!userData })
      return null
    }
    
    // Convert both to numbers for comparison to handle string/number mismatches
    const userId = Number(userData.id)
    const proUserId = Number(battleRoom.pro_user_id)
    const conUserId = Number(battleRoom.con_user_id)
    
    const side = userId === proUserId ? 'pro' : userId === conUserId ? 'con' : null
    
    console.log('getUserSide:', { 
      userId: userData.id, 
      userIdType: typeof userData.id,
      userIdNumber: userId,
      proUserId: battleRoom.pro_user_id,
      proUserIdType: typeof battleRoom.pro_user_id,
      proUserIdNumber: proUserId,
      conUserId: battleRoom.con_user_id,
      conUserIdType: typeof battleRoom.con_user_id,
      conUserIdNumber: conUserId,
      username: userData.username,
      side,
      battleRoomStatus: battleRoom.status,
      comparison: {
        userIdEqualsPro: userId === proUserId,
        userIdEqualsCon: userId === conUserId
      }
    })
    
    return side
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

  const getUserAvatar = (userId) => {
    if (!battleRoom) return null
    if (userId === battleRoom.pro_user_id && battleRoom.pro_user) {
      return battleRoom.pro_user.avatar_url
    }
    if (userId === battleRoom.con_user_id && battleRoom.con_user) {
      return battleRoom.con_user.avatar_url
    }
    return null
  }

  const getUserElo = (userId) => {
    if (!battleRoom) return 400
    if (userId === battleRoom.pro_user_id && battleRoom.pro_user) {
      return battleRoom.pro_user.elo_rating || 400
    }
    if (userId === battleRoom.con_user_id && battleRoom.con_user) {
      return battleRoom.con_user.elo_rating || 400
    }
    return 400
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    if (!round || !battleRoom) {
      console.log('Cannot submit: missing round or battleRoom', { round: !!round, battleRoom: !!battleRoom })
      return false
    }
    
    const userSide = getUserSide()
    if (!userSide) {
      console.log('Cannot submit: user side not determined')
      return false
    }
    
    const hasSubmitted = round[`${userSide}_argument`]
    
    // Enforce sequential submission: Con can only submit after Pro
    if (userSide === 'con' && !round.pro_argument) {
      console.log('Cannot submit: Pro must submit first')
      return false
    }
    
    const canSubmit = battleRoom.status === 'active' && round.status === 'active' && !hasSubmitted
    console.log('Can submit argument?', { 
      battleStatus: battleRoom.status, 
      roundStatus: round.status, 
      userSide, 
      hasSubmitted, 
      proSubmitted: !!round.pro_argument,
      canSubmit 
    })
    
    return canSubmit
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
              {debateTitle ? (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="font-medium">Topic:</span> {debateTitle}
                </p>
              ) : (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Loading topic...
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
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Pro User</div>
            <div className="flex items-center justify-center space-x-2">
              {getUserAvatar(battleRoom.pro_user_id) && (
                <img 
                  src={getUserAvatar(battleRoom.pro_user_id)} 
                  alt="Pro avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">{getUserName(battleRoom.pro_user_id)}</div>
                <div className="text-xs text-gray-500">ELO: {getUserElo(battleRoom.pro_user_id)}</div>
              </div>
            </div>
            {getUserSide() === 'pro' && <div className="text-xs text-blue-500">You</div>}
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="font-medium capitalize">{battleRoom.status}</div>
            <div className="text-xs text-gray-500">Round {currentRound}/{battleRoom.max_rounds}</div>
            {battleRoom.status === 'active' && timeRemaining > 0 && (
              <div className={`text-xs font-medium ${timeRemaining < 30 ? 'text-red-500' : 'text-green-500'}`}>
                <Timer className="w-3 h-3 inline mr-1" />
                {formatTime(timeRemaining)}
              </div>
            )}
            {battleRoom.status === 'completed' && battleRoom.completed_at && (
              <div className="text-xs text-gray-500">
                Completed: {formatTimestamp(battleRoom.completed_at)}
              </div>
            )}
          </div>
          
          <div>
            <div className="text-sm text-gray-500">Con User</div>
            <div className="flex items-center justify-center space-x-2">
              {getUserAvatar(battleRoom.con_user_id) && (
                <img 
                  src={getUserAvatar(battleRoom.con_user_id)} 
                  alt="Con avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <div className="font-medium">{getUserName(battleRoom.con_user_id)}</div>
                <div className="text-xs text-gray-500">ELO: {getUserElo(battleRoom.con_user_id)}</div>
              </div>
            </div>
            {getUserSide() === 'con' && <div className="text-xs text-blue-500">You</div>}
          </div>
        </div>
      </div>

      {/* Side Selection / Battle Ready Screen */}
      {battleRoom.status === 'waiting' && (
        <div className={`rounded-lg shadow-md p-8 mb-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
              <Sword className="w-6 h-6 mr-2" />
              Choose Your Side
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Both players are ready! Review your assigned sides below.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Pro Side */}
            <div className={`p-6 rounded-lg border-2 transition-all ${
              getUserSide() === 'pro' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-3xl mb-4">⚔️</div>
                <h3 className="text-xl font-bold text-blue-600 mb-2">PRO</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Arguing in favor of the topic
                </p>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {getUserAvatar(battleRoom.pro_user_id) && (
                    <img 
                      src={getUserAvatar(battleRoom.pro_user_id)} 
                      alt="Pro avatar"
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{getUserName(battleRoom.pro_user_id)}</div>
                    <div className="text-xs text-gray-500">ELO: {getUserElo(battleRoom.pro_user_id)}</div>
                  </div>
                </div>
                {getUserSide() === 'pro' && (
                  <div className="mt-4 px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
                    You are PRO
                  </div>
                )}
              </div>
            </div>

            {/* Con Side */}
            <div className={`p-6 rounded-lg border-2 transition-all ${
              getUserSide() === 'con' 
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-300 dark:border-gray-700'
            }`}>
              <div className="text-center">
                <div className="text-3xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold text-red-600 mb-2">CON</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Arguing against the topic
                </p>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  {getUserAvatar(battleRoom.con_user_id) && (
                    <img 
                      src={getUserAvatar(battleRoom.con_user_id)} 
                      alt="Con avatar"
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <div className="font-medium">{getUserName(battleRoom.con_user_id)}</div>
                    <div className="text-xs text-gray-500">ELO: {getUserElo(battleRoom.con_user_id)}</div>
                  </div>
                </div>
                {getUserSide() === 'con' && (
                  <div className="mt-4 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                    You are CON
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>Topic:</strong> {debateTitle || 'Loading...'}
              </p>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {battleRoom.max_rounds} rounds • {Math.floor(battleRoom.round_time_limit / 60)} minutes per round
              </p>
            </div>
            
            <button
              onClick={startBattle}
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 font-medium flex items-center justify-center mx-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Battle
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battle Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Round */}
          {battleRoom.status === 'active' && (
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Round {currentRound}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getCurrentRound()?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : getCurrentRound()?.status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {getCurrentRound()?.status || 'waiting'}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Pro Argument */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-blue-700">Pro Argument</div>
                    {getCurrentRound()?.pro_submitted_at && (
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(getCurrentRound().pro_submitted_at)}
                      </div>
                    )}
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-red-700">Con Argument</div>
                    {getCurrentRound()?.con_submitted_at && (
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(getCurrentRound().con_submitted_at)}
                      </div>
                    )}
                  </div>
                  {getCurrentRound()?.con_argument ? (
                    <div className="text-gray-700">
                      {getCurrentRound().con_argument}
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">Argument not submitted yet</div>
                  )}
                </div>
              </div>
              
              {/* Argument Submission Area */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-4 flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Your Argument
                </h4>
                
                {/* Status indicator for submission order */}
                <div className={`mb-4 p-3 rounded-lg ${
                  getCurrentRound()?.pro_argument && !getCurrentRound()?.con_argument
                    ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    : !getCurrentRound()?.pro_argument
                    ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                }`}>
                  <div className="text-sm">
                    {getCurrentRound()?.pro_argument && !getCurrentRound()?.con_argument ? (
                      <div className="text-blue-700 dark:text-blue-300">
                        <strong>✓ Pro argument submitted</strong> - Con can now submit their argument
                      </div>
                    ) : !getCurrentRound()?.pro_argument ? (
                      <div className="text-yellow-700 dark:text-yellow-300">
                        <strong>⏳ Waiting for Pro</strong> - Pro must submit their argument first
                      </div>
                    ) : (
                      <div className="text-green-700 dark:text-green-300">
                        <strong>✓ Both arguments submitted</strong> - Round complete
                      </div>
                    )}
                  </div>
                </div>

                {/* Argument input form */}
                {canSubmitArgument() && (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border-l-4 ${
                      getUserSide() === 'pro' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <div className="text-sm font-medium mb-1">
                        You are: <span className={`font-bold ${getUserSide() === 'pro' ? 'text-blue-600' : 'text-red-600'}`}>
                          {getUserSide() === 'pro' ? 'PRO' : 'CON'}
                        </span>
                      </div>
                      {getUserSide() === 'con' && !getCurrentRound()?.pro_argument && (
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          ⏳ Your input is disabled until Pro submits their argument
                        </div>
                      )}
                    </div>
                    
                    <textarea
                      ref={argumentRef}
                      value={argumentText}
                      onChange={(e) => setArgumentText(e.target.value)}
                      disabled={getUserSide() === 'con' && !getCurrentRound()?.pro_argument}
                      className={`w-full p-4 border rounded-lg resize-none ${
                        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      } ${
                        getUserSide() === 'con' && !getCurrentRound()?.pro_argument 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'focus:ring-2 focus:ring-blue-500'
                      }`}
                      rows="5"
                      placeholder={
                        getUserSide() === 'con' && !getCurrentRound()?.pro_argument
                          ? 'Waiting for Pro to submit...'
                          : `Enter your ${getUserSide()} argument for this round...`
                      }
                    />
                    
                    <button
                      onClick={submitArgument}
                      disabled={getUserSide() === 'con' && !getCurrentRound()?.pro_argument || !argumentText.trim()}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        getUserSide() === 'con' && !getCurrentRound()?.pro_argument || !argumentText.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {getUserSide() === 'con' && !getCurrentRound()?.pro_argument 
                        ? 'Wait for Pro' 
                        : 'Submit Argument'
                      }
                    </button>
                  </div>
                )}
                
                {/* Message when user already submitted */}
                {!canSubmitArgument() && getCurrentRound() && (
                  <div className={`p-4 rounded-lg ${
                    getCurrentRound()?.[`${getUserSide()}_argument`]
                      ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                      : 'bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}>
                    <div className="text-sm">
                      {getCurrentRound()?.[`${getUserSide()}_argument`] ? (
                        <div className="text-green-700 dark:text-green-300">
                          <strong>✓ You have submitted your argument</strong>
                        </div>
                      ) : (
                        <div className="text-gray-600 dark:text-gray-400">
                          {getUserSide() === 'con' && !getCurrentRound()?.pro_argument
                            ? 'Waiting for Pro to submit their argument first...'
                            : 'Waiting for round to start...'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Round History */}
          {battleRoom.status !== 'waiting' && (
            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Round History</h3>
                <button
                  onClick={() => setShowRoundHistory(!showRoundHistory)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  {showRoundHistory ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showRoundHistory && (
                <div className="space-y-4">
                  {rounds.map((round) => (
                    <div key={round.id} className={`p-4 rounded-lg border ${
                      round.round_number === currentRound 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Round {round.round_number}</div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          round.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : round.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {round.status}
                        </div>
                      </div>
                      
                      {round.pro_argument && (
                        <div className="mb-2">
                          <div className="text-xs text-blue-600 font-medium">Pro:</div>
                          <div className="text-sm text-gray-700">{round.pro_argument}</div>
                        </div>
                      )}
                      
                      {round.con_argument && (
                        <div className="mb-2">
                          <div className="text-xs text-red-600 font-medium">Con:</div>
                          <div className="text-sm text-gray-700">{round.con_argument}</div>
                        </div>
                      )}
                      
                      {!round.pro_argument && !round.con_argument && (
                        <div className="text-sm text-gray-400 italic">No arguments submitted</div>
                      )}
                    </div>
                  ))}
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
                
                {/* Detailed Voting Criteria */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Rate the debate (1-10)</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Confidence: {voteData.confidence}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={voteData.confidence}
                        onChange={(e) => setVoteData(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Argument Quality: {voteData.argument_quality}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={voteData.argument_quality}
                        onChange={(e) => setVoteData(prev => ({ ...prev, argument_quality: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clarity: {voteData.clarity}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={voteData.clarity}
                        onChange={(e) => setVoteData(prev => ({ ...prev, clarity: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Persuasiveness: {voteData.persuasiveness}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={voteData.persuasiveness}
                        onChange={(e) => setVoteData(prev => ({ ...prev, persuasiveness: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Evidence: {voteData.evidence}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={voteData.evidence}
                        onChange={(e) => setVoteData(prev => ({ ...prev, evidence: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
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

          {/* AI Battle Results */}
          {showAIResults && battleRoom.status === 'completed' && (
            <BattleResults battleRoomId={battleRoom.id} darkMode={darkMode} />
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
