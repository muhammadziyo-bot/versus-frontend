import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Sword, TrendingUp, Shield, Bot, GraduationCap, Scale, Globe, Microscope, Building2, Palette, Trophy, Zap, Bell, Book } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TopicCard from './components/TopicCard'
import LoginModal from './components/LoginModal'
import MotivationalQuote from './components/MotivationalQuote'
import ClubsView from './pages/ClubsView'
import ClubDetailView from './pages/ClubDetailView'
import DebatersView from './pages/DebatersView'
import DiscussionsView from './pages/DiscussionsView'
import SettingsView from './pages/SettingsView'
import HelpView from './pages/HelpView'
import BattleView from './pages/BattleView'
import FriendsView from './pages/FriendsView'
import DiscussionDetailView from './pages/DiscussionDetailView'
import ProfileView from './pages/ProfileView'
import TopicProposalModal from './components/TopicProposalModal'
import NotificationCenter from './components/NotificationCenter'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import debateService from './services/debateService'
import clubService from './services/clubService'
import userService from './services/userService'
import discussionService from './services/discussionService'
import battleService from './services/battleService'
import websocketService from './services/websocketService'
import notificationService from './services/notificationService'

const getClubBadge = (badge) => {
  switch(badge) {
    case 'bot': return <Bot className="w-6 h-6" />;
    case 'graduation': return <GraduationCap className="w-6 h-6" />;
    case 'scale': return <Scale className="w-6 h-6" />;
    case 'globe': return <Globe className="w-6 h-6" />;
    case 'microscope': return <Microscope className="w-6 h-6" />;
    case 'building': return <Building2 className="w-6 h-6" />;
    case 'palette': return <Palette className="w-6 h-6" />;
    case 'trophy': return <Trophy className="w-6 h-6" />;
    case '🤖': return <Bot className="w-6 h-6" />;
    case '🎓': return <GraduationCap className="w-6 h-6" />;
    case '⚖️': return <Scale className="w-6 h-6" />;
    case '🌍': return <Globe className="w-6 h-6" />;
    case '🔬': return <Microscope className="w-6 h-6" />;
    case '🏛️': return <Building2 className="w-6 h-6" />;
    case '🎨': return <Palette className="w-6 h-6" />;
    case '⚽': return <Trophy className="w-6 h-6" />;
    case '📚': return <Book className="w-6 h-6" />;
    default: return <Shield className="w-6 h-6" />;
  }
}

// Wrapper components to properly access route parameters
const BattleTopicWrapper = ({ darkMode, onBack }) => {
  const params = useParams()
  return (
    <div className="flex-1">
      <BattleView
        debateId={params.debateId}
        battleRoomId={null}
        onBack={onBack}
        darkMode={darkMode}
      />
    </div>
  )
}

const BattleRoomWrapper = ({ darkMode, onBack }) => {
  const params = useParams()
  return (
    <div className="flex-1">
      <BattleView
        debateId={null}
        battleRoomId={params.roomId}
        onBack={onBack}
        darkMode={darkMode}
      />
    </div>
  )
}

// Wrapper components for each route to provide common context
const Layout = ({ children, darkMode, currentView }) => (
  <div className={`min-h-screen flex ${darkMode ? 'bg-academic-midnight text-off-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
    <Sidebar currentView={currentView} darkMode={darkMode} />
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
)

function AppContent() {
  const { user, loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showTopicModal, setShowTopicModal] = useState(false)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const [topics, setTopics] = useState([])
  const [clubs, setClubs] = useState([])
  const [debaters, setDebaters] = useState([])
  const [discussions, setDiscussions] = useState([])
  const [debateStats, setDebateStats] = useState({})
  const [clubStats, setClubStats] = useState({})
  const [userStats, setUserStats] = useState({})
  const [discussionStats, setDiscussionStats] = useState({})
  const [battleStats, setBattleStats] = useState({})
  const [dataLoading, setDataLoading] = useState(true)
  const [currentBattle, setCurrentBattle] = useState(null)
  const [battleError, setBattleError] = useState(null)

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  const fetchData = async () => {
    try {
      setDataLoading(true)
      const [debatesData, clubsData, debatersData, discussionsData, debateStatsData, clubStatsData, userStatsData, discussionStatsData, battleStatsData] = await Promise.all([
        debateService.getDebates(),
        clubService.getClubs(),
        userService.getTopDebaters(),
        discussionService.getDiscussions(),
        debateService.getDebateStats(),
        clubService.getClubStats(),
        userService.getUserStats(),
        discussionService.getDiscussionStats(),
        battleService.getBattleStats()
      ])
      setTopics(debatesData)
      setClubs(clubsData)
      setDebaters(debatersData)
      setDiscussions(discussionsData)
      setDebateStats(debateStatsData)
      setClubStats(clubStatsData)
      setUserStats(userStatsData)
      setDiscussionStats(discussionStatsData)
      setBattleStats(battleStatsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      loadUnreadCount()
    } else {
      setTopics([])
      setClubs([])
      setDebaters([])
      setDiscussions([])
      setDebateStats({})
      setClubStats({})
      setUserStats({})
      setDiscussionStats({})
      setBattleStats({})
      setDataLoading(false)
      setUnreadCount(0)
    }
  }, [isAuthenticated])

  const refreshData = () => {
    if (isAuthenticated) {
      fetchData()
    }
  }

  const handleTopicCreated = (newTopic) => {
    setTopics(prevTopics => [newTopic, ...prevTopics])
    fetchData()
  }

  const handleStartBattle = (debateId) => {
    try {
      setBattleError(null)
      setCurrentBattle(null)
      navigate(`/battle/topic/${debateId}`)
    } catch (error) {
      setBattleError(error.message || 'Failed to open battle arena')
      console.error('Battle navigation error:', error)
    }
  }

  const handleNavigateToBattle = async (battleId) => {
    try {
      setBattleError(null)
      setCurrentBattle(null)
      navigate(`/battle/room/${battleId}`)
    } catch (error) {
      setBattleError(error.message || 'Failed to navigate to battle room')
      console.error('Battle navigation error:', error)
    }
  }

  const handleCloseBattle = () => {
    if (currentBattle) {
      websocketService.disconnectFromBattle(currentBattle.id)
    }
    setCurrentBattle(null)
    setBattleError(null)
    navigate('/')
  }

  const handleShowTopicModal = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
    } else {
      setShowTopicModal(true)
    }
  }

  const handleProfileSelect = (username) => {
    if (username && username !== 'undefined') {
      navigate(`/profile/${username}`)
    } else {
      console.error('Invalid username provided to handleProfileSelect:', username)
    }
  }

  const handleClubSelect = (club) => {
    navigate(`/clubs/${club.id}`)
  }

  const handleDiscussionSelect = (discussion) => {
    navigate(`/discussions/${discussion.id}`)
  }

  // Helper to get current view from pathname
  const getCurrentView = () => {
    const path = location.pathname
    if (path === '/') return 'arena'
    if (path.startsWith('/debaters')) return 'debaters'
    if (path.startsWith('/discussions')) return 'discussions'
    if (path.startsWith('/clubs')) return 'clubs'
    if (path.startsWith('/settings')) return 'settings'
    if (path.startsWith('/help')) return 'help'
    if (path.startsWith('/friends')) return 'friends'
    if (path.startsWith('/battle')) return 'arena'
    return 'arena'
  }

  const currentView = getCurrentView()

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-academic-midnight' : 'bg-gray-50'} transition-colors duration-300`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
        </div>
        <LoginModal 
          show={showLoginModal && !isAuthenticated} 
          onClose={() => setShowLoginModal(false)} 
          darkMode={darkMode} 
          onToggleMode={() => setDarkMode(!darkMode)} 
        />
      </div>
    )
  }

  return (
    <>
      <Routes>
        {/* Home / Arena */}
        <Route path="/" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <div className="flex-1">
              <Header 
                title="Digital Arena" 
                icon={Sword}
                darkMode={darkMode} 
                setDarkMode={setDarkMode} 
                user={user}
                isAuthenticated={isAuthenticated}
                onShowLogin={() => setShowLoginModal(true)}
                onProfileSelect={handleProfileSelect}
              >
                {isAuthenticated && (
                  <button
                    onClick={() => setShowNotificationCenter(true)}
                    className={`relative p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-electric-blue text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}
              </Header>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                  <div className="text-center md:text-left max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-3">The Digital Arena</h2>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Structured debates on today's most pressing topics. Choose your side, make your case.
                    </p>
                  </div>
                  <MotivationalQuote darkMode={darkMode} variant="inline" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <i className="fas fa-users w-6 h-6 text-electric-blue flex items-center justify-center"></i>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Clubs</span>
                    </div>
                    <div className="text-2xl font-bold">{dataLoading ? '...' : clubStats.total_clubs || 0}</div>
                  </div>
                  <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <i className="fas fa-message w-6 h-6 text-venom-red flex items-center justify-center"></i>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Arguments</span>
                    </div>
                    <div className="text-2xl font-bold">{dataLoading ? '...' : debateStats.total_arguments || 0}</div>
                  </div>
                  <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Debates</span>
                    </div>
                    <div className="text-2xl font-bold">{dataLoading ? '...' : debateStats.active_debates || 0}</div>
                  </div>
                  <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
                    <div className="flex items-center space-x-3 mb-2">
                      <Zap className="w-6 h-6 text-yellow-500" />
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Battles</span>
                    </div>
                    <div className="text-2xl font-bold">{dataLoading ? '...' : battleStats.active_battles || 0}</div>
                  </div>
                </div>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-6">Active Debates</h3>
                  {dataLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : topics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {topics.map((topic) => (
                        <TopicCard 
                          key={topic.id} 
                          topic={{
                            ...topic,
                            proCount: topic.pro_count,
                            conCount: topic.con_count,
                            totalArguments: topic.total_arguments
                          }} 
                          onStartBattle={handleStartBattle}
                          user={user}
                          isAuthenticated={isAuthenticated}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <p>No active debates yet. Be the first to start one!</p>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <button 
                    onClick={handleShowTopicModal}
                    className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <i className="fas fa-plus w-5 h-5 flex items-center justify-center"></i>
                    <span>Propose New Topic</span>
                  </button>
                </div>
              </main>
            </div>
          </Layout>
        } />

        {/* Debaters */}
        <Route path="/debaters" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <DebatersView 
              debaters={debaters} 
              userStats={userStats}
              dataLoading={dataLoading}
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={user}
              isAuthenticated={isAuthenticated}
              onShowLogin={() => setShowLoginModal(true)}
              onProfileSelect={handleProfileSelect}
            />
          </Layout>
        } />

        {/* Discussions */}
        <Route path="/discussions" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <DiscussionsView 
              discussions={discussions} 
              setDiscussions={setDiscussions}
              discussionStats={discussionStats}
              dataLoading={dataLoading}
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={user}
              isAuthenticated={isAuthenticated}
              onShowLogin={() => setShowLoginModal(true)}
              refreshData={refreshData}
              onDiscussionSelect={handleDiscussionSelect}
              onProfileSelect={handleProfileSelect}
            />
          </Layout>
        } />

        {/* Discussion Detail */}
        <Route path="/discussions/:id" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <DiscussionDetailView 
              onBack={() => navigate('/discussions')} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              onNavigate={(view) => navigate(`/${view}`)} 
              user={user} 
              isAuthenticated={isAuthenticated} 
              onShowLogin={() => setShowLoginModal(true)} 
              onProfileSelect={handleProfileSelect} 
            />
          </Layout>
        } />

        {/* Clubs */}
        <Route path="/clubs" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <ClubsView 
              clubs={clubs} 
              setClubs={setClubs}
              onClubSelect={handleClubSelect} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              getClubBadge={getClubBadge}
              dataLoading={dataLoading}
              refreshData={refreshData}
              user={user}
              isAuthenticated={isAuthenticated}
              onShowLogin={() => setShowLoginModal(true)}
              onProfileSelect={handleProfileSelect}
            />
          </Layout>
        } />

        {/* Club Detail */}
        <Route path="/clubs/:id" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <ClubDetailView 
              onBack={() => navigate('/clubs')} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              onNavigate={(view) => navigate(`/${view}`)} 
              getClubBadge={getClubBadge} 
              user={user} 
              isAuthenticated={isAuthenticated} 
              onShowLogin={() => setShowLoginModal(true)} 
              onProfileSelect={handleProfileSelect} 
              setClubs={setClubs}
            />
          </Layout>
        } />

        {/* Profile */}
        <Route path="/profile/:username" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <ProfileView 
              onBack={() => navigate('/debaters')} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              onNavigate={(view) => navigate(`/${view}`)} 
              user={user} 
              isAuthenticated={isAuthenticated} 
              onShowLogin={() => setShowLoginModal(true)} 
              onProfileSelect={handleProfileSelect} 
            />
          </Layout>
        } />

        {/* Settings */}
        <Route path="/settings" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <SettingsView 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={user} 
              isAuthenticated={isAuthenticated} 
              onShowLogin={() => setShowLoginModal(true)} 
              onProfileSelect={handleProfileSelect} 
            />
          </Layout>
        } />

        {/* Help */}
        <Route path="/help" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <HelpView 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={user} 
              isAuthenticated={isAuthenticated} 
              onShowLogin={() => setShowLoginModal(true)} 
              onProfileSelect={handleProfileSelect} 
            />
          </Layout>
        } />

        {/* Friends */}
        <Route path="/friends" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <FriendsView 
              darkMode={darkMode} 
              setDarkMode={setDarkMode} 
              user={user}
              isAuthenticated={isAuthenticated}
              onShowLogin={() => setShowLoginModal(true)}
              onProfileSelect={handleProfileSelect}
            />
          </Layout>
        } />

        {/* Battle - Topic */}
        <Route path="/battle/topic/:debateId" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <BattleTopicWrapper darkMode={darkMode} onBack={handleCloseBattle} />
          </Layout>
        } />

        {/* Battle - Room */}
        <Route path="/battle/room/:roomId" element={
          <Layout darkMode={darkMode} setDarkMode={setDarkMode} currentView={currentView}>
            <BattleRoomWrapper darkMode={darkMode} onBack={handleCloseBattle} />
          </Layout>
        } />
      </Routes>

      {/* Global Modals */}
      <LoginModal 
        show={showLoginModal && !isAuthenticated} 
        onClose={() => setShowLoginModal(false)} 
        darkMode={darkMode} 
        onToggleMode={() => setDarkMode(!darkMode)} 
      />

      {showTopicModal && (
        <TopicProposalModal
          darkMode={darkMode}
          onClose={() => setShowTopicModal(false)}
          onTopicCreated={handleTopicCreated}
          onShowLogin={() => {
            setShowTopicModal(false)
            setShowLoginModal(true)
          }}
        />
      )}

      {battleError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-card-bg border border-gray-800' : 'bg-white'} transition-colors duration-300`}>
            <h3 className="text-lg font-semibold mb-4 text-red-500">Battle Error</h3>
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {battleError}
            </p>
            <button
              onClick={() => setBattleError(null)}
              className={`w-full px-4 py-2 rounded-lg font-medium ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              } transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        darkMode={darkMode}
        user={user}
        isAuthenticated={isAuthenticated}
        onNavigateToBattle={handleNavigateToBattle}
      />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
