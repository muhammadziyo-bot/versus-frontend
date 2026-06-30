import React from 'react'
import { Sword } from 'lucide-react'

function TopicCard({ topic, darkMode, onStartBattle, user, isAuthenticated }) {
  const proPercentage = Math.round((topic.proCount / topic.totalArguments) * 100)
  const conPercentage = Math.round((topic.conCount / topic.totalArguments) * 100)

  return (
    <div 
      className={`rounded-lg p-6 border transition-colors ${
        darkMode 
          ? 'bg-card-bg border-gray-800 hover:border-electric-blue' 
          : 'bg-white border-gray-200 hover:border-electric-blue'
      }`}
    >
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${
          darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
        }`}>
          {topic.category}
        </span>
        <h4 className="text-lg font-semibold mb-2">{topic.title}</h4>
        <p className={`text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{topic.description}</p>
      </div>
      
      {/* Pulse Meter */}
      <div className="mb-4">
        <div className={`flex justify-between text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>Pro: {proPercentage}%</span>
          <span>Con: {conPercentage}%</span>
        </div>
        <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div 
              className="bg-electric-blue transition-all duration-300"
              style={{ width: `${proPercentage}%` }}
            />
            <div 
              className="bg-venom-red transition-all duration-300"
              style={{ width: `${conPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`flex justify-between items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <span>{topic.totalArguments} arguments</span>
        <div className="flex space-x-2">
          {isAuthenticated && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Navigate directly to BattleView with the topic
                if (onStartBattle) {
                  onStartBattle(topic.id)
                }
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                darkMode 
                  ? 'bg-red-900 hover:bg-red-800 text-red-300' 
                  : 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            >
              <Sword className="w-3 h-3 inline mr-1" />
              Battle
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopicCard
