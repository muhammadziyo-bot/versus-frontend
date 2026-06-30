import Login from './Login'

const LoginModal = ({ show, onClose, darkMode, onToggleMode }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-lg p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-card-bg border border-gray-800' : 'bg-white'} transition-colors duration-300 relative`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors z-10`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Login darkMode={darkMode} onToggleMode={onToggleMode} />
      </div>
    </div>
  )
}

export default LoginModal
