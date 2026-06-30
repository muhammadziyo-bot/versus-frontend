import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, MessageSquare, Settings, HelpCircle, Shield, Sword, UserPlus } from 'lucide-react'

function Sidebar({ currentView, darkMode }) {
  const navigate = useNavigate()
  const menuItems = [
    { icon: Users, label: 'Debaters', view: 'debaters', path: '/debaters' },
    { icon: MessageSquare, label: 'Discussions', view: 'discussions', path: '/discussions' },
    { icon: Shield, label: 'Clubs', view: 'clubs', path: '/clubs' },
    { icon: Sword, label: 'Arena', view: 'arena', path: '/' },
    { icon: UserPlus, label: 'Friends', view: 'friends', path: '/friends' },
    { icon: Settings, label: 'Settings', view: 'settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', view: 'help', path: '/help' }
  ]

  return (
    <div className={`w-32 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col py-4 space-y-2`}>
      <div className="flex flex-col space-y-1">
        {menuItems.map((item) => (
          <div
            key={item.view}
            onClick={() => navigate(item.path)}
            className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors rounded-lg ${
              currentView === item.view
                ? darkMode ? 'bg-gray-800' : 'bg-gray-100'
                : `hover:${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sidebar
