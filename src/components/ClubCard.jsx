import { Users, MessageSquare, Shield, User } from 'lucide-react'

function ClubCard({ club, onSelect, darkMode, getClubBadge }) {
  const isMember = club.is_member || club.isMember
  const memberCount = club.member_count || club.memberCount || 0
  const activeBattles = club.active_battles || club.activeBattles || 0

  // Focus areas: prefer category, then a small set derived from description
  const focusAreas = club.category
    ? [club.category]
    : (club.focus || ['General'])

  return (
    <div
      className={`rounded-lg p-6 border cursor-pointer transition-all duration-300 ${
        darkMode
          ? 'bg-card-bg border-gray-800 hover:border-electric-blue hover:shadow-lg'
          : 'bg-white border-gray-200 hover:border-electric-blue hover:shadow-lg'
      }`}
      onClick={onSelect}
    >
      {/* Club Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-electric-blue ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            {getClubBadge(club.badge)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{club.name}</h3>
            <span className={`text-xs px-2 py-1 rounded ${
              darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              {club.category}
            </span>
          </div>
        </div>
        {isMember && (
          <span className={`px-2 py-1 text-xs rounded bg-electric-blue/20 text-electric-blue`}>
            Member
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {club.description || 'No description yet.'}
      </p>

      {/* Focus Areas */}
      <div className="mb-4">
        <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Focus Areas:</p>
        <div className="flex flex-wrap gap-1">
          {focusAreas.slice(0, 3).map((area, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center space-x-1 text-electric-blue mb-1">
            <Users className="w-3 h-3" />
            <span className="text-xs font-medium">{memberCount}</span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Members</p>
        </div>
        <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center space-x-1 text-orange-500 mb-1">
            <Shield className="w-3 h-3" />
            <span className="text-xs font-medium">{activeBattles}</span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Battles</p>
        </div>
        <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-center space-x-1 text-purple-500 mb-1">
            <MessageSquare className="w-3 h-3" />
            <span className="text-xs font-medium">{club.discussion_count || 0}</span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Discussions</p>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex justify-between items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <span className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>{club.founder || 'Unknown'}</span>
        </span>
        <span className="text-electric-blue hover:underline">{isMember ? 'View club →' : 'Join club →'}</span>
      </div>
    </div>
  )
}

export default ClubCard
