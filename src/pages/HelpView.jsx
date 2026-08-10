import { useState } from 'react'
import { HelpCircle, Mail, Search, ChevronDown, ChevronUp, Rocket, Scale, Shield } from 'lucide-react'
import Header from '../components/Header'

function HelpView({ darkMode, setDarkMode, user, isAuthenticated, onShowLogin, onProfileSelect }) {
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const faqCategories = [
    {
      title: "Getting Started",
      icon: Rocket,
      questions: [
        {
          id: 1,
          question: "How do I join my first debate?",
          answer: "Navigate to the Arena page, browse available topics, and click on any debate that interests you. You can vote immediately and then participate in the discussion."
        },
        {
          id: 2,
          question: "What are clubs and how do I join one?",
          answer: "Clubs are communities of debaters with similar interests. Go to the Clubs section, browse available clubs, and click 'Join Club' on any that interest you. Some clubs may have membership requirements."
        },
        {
          id: 3,
          question: "How do I create a new debate topic?",
          answer: "Click the 'Propose New Topic' button on the Arena page to suggest a debate topic. Topics are reviewed before appearing publicly for community participation."
        }
      ]
    },
    {
      title: "Debating Rules",
      icon: Scale,
      questions: [
        {
          id: 4,
          question: "What are the community guidelines?",
          answer: "Be respectful, stay on topic, provide evidence for claims, avoid personal attacks, and maintain constructive dialogue. Repeated violations may result in temporary or permanent bans."
        },
        {
          id: 5,
          question: "How are debates moderated?",
          answer: "Our moderation team reviews reported content and enforces community guidelines. We use both automated systems and human moderators to maintain quality discussions."
        },
        {
          id: 6,
          question: "Can I change my vote after participating?",
          answer: "Votes are final once submitted. If you have concerns about your vote, please contact our support team."
        }
      ]
    },
    {
      title: "Account & Privacy",
      icon: Shield,
      questions: [
        {
          id: 7,
          question: "How do I delete my account?",
          answer: "To request account deletion, please contact our support team at support@digitalarena.app. This action is permanent and cannot be undone; your debates will remain anonymous."
        },
        {
          id: 8,
          question: "Can I debate anonymously?",
          answer: "Yes, you can participate in debates without revealing your real identity. However, your username will still be visible to maintain accountability."
        },
        {
          id: 9,
          question: "How is my data protected?",
          answer: "We use industry-standard encryption, never sell personal data, and comply with GDPR and other privacy regulations. You can request a copy of your data at any time."
        }
      ]
    }
  ]

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className="flex-1">
        <Header 
          title="Help Center" 
          icon={HelpCircle}
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
              Find answers, get support, and learn how to make the most of Digital Arena
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Browse our comprehensive help resources or contact our support team for assistance
            </p>
          </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative w-full">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search for help articles, FAQs, and topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-900 border-gray-700 text-off-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:border-electric-blue`}
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          
          {faqCategories
            .map((category) => {
              const term = searchQuery.trim().toLowerCase()
              const matchingQuestions = term
                ? category.questions.filter(
                    (faq) =>
                      faq.question.toLowerCase().includes(term) ||
                      faq.answer.toLowerCase().includes(term)
                  )
                : category.questions
              return { ...category, questions: matchingQuestions }
            })
            .filter((category) => category.questions.length > 0)
            .map((category) => (
            <div key={category.title} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <category.icon className="w-6 h-6 text-electric-blue" />
                <span>{category.title}</span>
              </h3>
              
              <div className="space-y-3">
                {category.questions.map((faq) => (
                  <div 
                    key={faq.id}
                    className={`rounded-lg border overflow-hidden ${
                      darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-opacity-50 hover:bg-electric-blue/10 transition-colors"
                    >
                      <span className="font-medium">{faq.question}</span>
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-electric-blue" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedFAQ === faq.id && (
                      <div className={`px-4 pb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {searchQuery.trim() && faqCategories.every((c) => {
            const term = searchQuery.trim().toLowerCase()
            return !c.questions.some(
              (faq) => faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term)
            )
          }) && (
            <div className="text-center py-8">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No help articles found for "{searchQuery.trim()}". Try a different search.
              </p>
            </div>
          )}
        </div>

        {/* Popular Topics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "How to win debates",
              "Club management",
              "Reporting inappropriate content",
              "Account security tips",
              "Debate etiquette guidelines",
              "Mobile app features",
              "Community standards",
              "Technical troubleshooting"
            ].map((topic, index) => (
              <button
                key={index}
                className={`p-4 rounded-lg border text-left hover:border-electric-blue transition-colors ${
                  darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className={`rounded-lg border p-8 text-center ${
          darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <HelpCircle className="w-12 h-12 text-electric-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Our support team is here to help you with any questions or issues you might have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@digitalarena.app"
              className={`inline-flex items-center justify-center px-6 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-5 h-5 mr-2" />
              <span>Email Support</span>
            </a>
          </div>
        </div>
        </main>
    </div>
  )
}

export default HelpView
