import { Quote } from 'lucide-react'

function MotivationalQuote({ darkMode }) {
  return (
    <div className="flex justify-center mb-10">
      <div className={`relative max-w-2xl w-full px-6 py-6 text-center rounded-xl border ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'} transition-colors duration-300`}>
        <Quote className={`w-6 h-6 mx-auto mb-3 ${darkMode ? 'text-electric-blue' : 'text-electric-blue'}`} />
        <p className={`italic font-serif text-lg md:text-2xl leading-relaxed ${darkMode ? 'text-off-white' : 'text-gray-800'}`}>
          &ldquo;No matter what anybody tells you, words and ideas can change the world.&rdquo;
        </p>
        <div className={`mt-4 mx-auto w-16 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
        <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          &mdash; John Keating, <span className="italic">Dead Poets Society</span> (1989)
        </p>
      </div>
    </div>
  )
}

export default MotivationalQuote
