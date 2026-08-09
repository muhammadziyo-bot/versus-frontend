import { useState, useMemo } from 'react'
import { Shield, Plus, Bot, GraduationCap, Scale, Globe, Microscope, Building2, Palette, Trophy, AlertCircle, Search } from 'lucide-react'
import ClubCard from '../components/ClubCard'
import Header from '../components/Header'
import clubService from '../services/clubService'

function ClubsView({ clubs, setClubs, onClubSelect, darkMode, setDarkMode, getClubBadge, refreshData, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const [renderError, setRenderError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Club creation form state
  const [clubName, setClubName] = useState('')
  const [clubDescription, setClubDescription] = useState('')
  const [clubCategory, setClubCategory] = useState('Technology')
  const [clubBadge, setClubBadge] = useState('bot')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const categories = ['All', 'Technology', 'Education', 'Social Policy', 'Environment', 'Science', 'Politics', 'Arts', 'Sports']
  const categoryOptions = ['Technology', 'Education', 'Social Policy', 'Environment', 'Science', 'Politics', 'Arts', 'Sports']
  const badgeOptions = [
    { id: 'bot', icon: Bot, label: 'Technology' },
    { id: 'graduation', icon: GraduationCap, label: 'Education' },
    { id: 'scale', icon: Scale, label: 'Social Policy' },
    { id: 'globe', icon: Globe, label: 'Environment' },
    { id: 'microscope', icon: Microscope, label: 'Science' },
    { id: 'building', icon: Building2, label: 'Politics' },
    { id: 'palette', icon: Palette, label: 'Arts' },
    { id: 'trophy', icon: Trophy, label: 'Sports' }
  ]

  const filteredClubs = useMemo(() => {
    let result = clubs || []

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(club => club.category === selectedCategory)
    }

    // Search filter
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      result = result.filter(club =>
        (club.name || '').toLowerCase().includes(term) ||
        (club.description || '').toLowerCase().includes(term) ||
        (club.category || '').toLowerCase().includes(term) ||
        (club.founder || '').toLowerCase().includes(term)
      )
    }

    // Sort
    const sorted = [...result]
    if (sortBy === 'members') {
      sorted.sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
    } else {
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }

    return sorted
  }, [clubs, selectedCategory, searchTerm, sortBy])

  const handleCreateClub = async () => {
    if (!isAuthenticated) {
      onShowLogin()
      return
    }

    if (!clubName.trim()) {
      setError('Club name is required')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const created = await clubService.createClub({
        name: clubName,
        description: clubDescription,
        category: clubCategory,
        badge: clubBadge
      })

      // Optimistically append the new club
      if (setClubs) {
        const formatted = {
          ...created,
          member_count: 1,
          active_battles: 0,
          is_member: true,
          founder: user?.username || 'You',
        }
        setClubs(prev => [formatted, ...(prev || [])])
      }

      // Reset form and close modal
      setClubName('')
      setClubDescription('')
      setClubCategory('Technology')
      setClubBadge('bot')
      setShowCreateModal(false)
    } catch (err) {
      setError(err.detail || 'Failed to create club')
      console.error('Error creating club:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
      <div className="flex-1">
        {renderError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 m-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Error loading clubs: {renderError}</span>
            </div>
            <button
              onClick={() => {
                setRenderError(null)
                if (refreshData) refreshData()
              }}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        <Header
          title="Debate Clubs"
          icon={Shield}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          isAuthenticated={isAuthenticated}
          onShowLogin={onShowLogin}
          onProfileSelect={onProfileSelect}
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Club</span>
          </button>
        </Header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">
              Join a Debate Club
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Connect with like-minded debaters, prepare for battles, and strengthen your arguments in specialized communities.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
              <div className="flex items-center space-x-3 mb-2">
                <i className="fas fa-users w-6 h-6 text-electric-blue flex items-center justify-center"></i>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Clubs</span>
              </div>
              <div className="text-2xl font-bold">{clubs?.length || 0}</div>
            </div>
            <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
              <div className="flex items-center space-x-3 mb-2">
                <i className="fas fa-user-friends w-6 h-6 text-venom-red flex items-center justify-center"></i>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Members</span>
              </div>
              <div className="text-2xl font-bold">{clubs?.reduce((sum, club) => sum + (club.member_count || club.memberCount || 0), 0) || 0}</div>
            </div>
            <div className={`rounded-lg p-6 border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
              <div className="flex items-center space-x-3 mb-2">
                <i className="fas fa-trophy w-6 h-6 text-green-500 flex items-center justify-center"></i>
                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Active Battles</span>
              </div>
              <div className="text-2xl font-bold">{clubs?.reduce((sum, club) => sum + (club.active_battles || club.activeBattles || 0), 0) || 0}</div>
            </div>
          </div>

          {/* Search + Sort + Category Filter */}
          <div className="mb-8 space-y-4">
            {/* Search bar */}
            <div className="flex items-center justify-between gap-4">
              <div className={`flex items-center flex-1 max-w-md rounded-lg border px-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <Search className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clubs by name, topic, or founder..."
                  className={`w-full p-3 bg-transparent outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-3 py-3 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="newest">Newest</option>
                <option value="members">Most Members</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-electric-blue text-white'
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

          {/* Clubs Grid */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6">
              {searchTerm ? `Results for "${searchTerm}"` : selectedCategory === 'All' ? 'All Clubs' : `${selectedCategory} Clubs`}
              <span className={`ml-2 text-base font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({filteredClubs.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => {
                try {
                  return (
                    <ClubCard
                      key={club.id}
                      club={club}
                      onSelect={() => onClubSelect(club)}
                      darkMode={darkMode}
                      getClubBadge={getClubBadge}
                    />
                  )
                } catch (err) {
                  console.error('Error rendering club card:', err, club)
                  return null
                }
              })}
            </div>
          </div>

          {/* No clubs found */}
          {filteredClubs.length === 0 && (
            <div className="text-center py-12">
              <Shield className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className="text-xl font-semibold mb-2">No clubs found</h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm
                  ? `No clubs match "${searchTerm}". Try a different search.`
                  : `No clubs available in the ${selectedCategory} category yet.`}
              </p>
            </div>
          )}
        </main>

        {/* Create Club Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-xl font-semibold mb-4">Create New Club</h3>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Club Name *
                  </label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Enter club name"
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-off-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                    placeholder="Describe your club's purpose"
                    className={`w-full p-3 border rounded-lg resize-none ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-off-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={clubCategory}
                    onChange={(e) => setClubCategory(e.target.value)}
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? 'bg-gray-900 border-gray-700 text-off-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Badge
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {badgeOptions.map((badge) => {
                      const Icon = badge.icon
                      return (
                        <button
                          key={badge.id}
                          onClick={() => setClubBadge(badge.id)}
                          className={`w-10 h-10 rounded-lg border-2 transition-colors flex items-center justify-center ${
                            clubBadge === badge.id
                              ? 'border-electric-blue bg-electric-blue/20 text-electric-blue'
                              : darkMode
                                ? 'border-gray-700 hover:border-gray-600 text-gray-400'
                                : 'border-gray-300 hover:border-gray-400 text-gray-600'
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
                  onClick={() => {
                    setShowCreateModal(false)
                    setError(null)
                    setClubName('')
                    setClubDescription('')
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClub}
                  disabled={creating}
                  className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
}

export default ClubsView
