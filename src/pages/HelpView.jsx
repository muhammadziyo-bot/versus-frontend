import React, { useState } from 'react'
import { HelpCircle, MessageSquare, Book, Mail, Search, ChevronDown, ChevronUp, ExternalLink, Rocket, Scale, Shield } from 'lucide-react'
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
          answer: "Currently, topic creation is managed by moderators. However, you can suggest new topics in the Discussions section or contact our team directly."
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
          answer: "Yes, you can change your vote within the first 30 minutes of participating. After that, votes are locked to maintain debate integrity."
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
          answer: "Go to Settings > Privacy & Security > Delete Account. Please note this action is permanent and cannot be undone. Your debates will remain anonymous."
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

  const supportOptions = [
    {
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      icon: MessageSquare,
      action: "Start Chat",
      available: "24/7"
    },
    {
      title: "Email Support",
      description: "Send us detailed questions or reports",
      icon: Mail,
      action: "Send Email",
      available: "Response within 24h"
    },
    {
      title: "Help Center",
      description: "Browse our comprehensive documentation",
      icon: Book,
      action: "Visit Help Center",
      available: "Always available"
    }
  ]

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-academic-midnight text-off-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {supportOptions.map((option, index) => (
            <div 
              key={index}
              className={`rounded-lg border p-6 hover:shadow-lg transition-all cursor-pointer ${
                darkMode ? 'bg-card-bg border-gray-800 hover:border-green-500' : 'bg-white border-gray-200 hover:border-green-500'
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <option.icon className="w-6 h-6 text-green-500" />
                <h3 className="font-semibold">{option.title}</h3>
              </div>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {option.description}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {option.available}
                </span>
                <button className="text-electric-blue hover:text-blue-600 text-sm font-medium flex items-center space-x-1">
                  <span>{option.action}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          
          {faqCategories.map((category) => (
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
            <button className="px-6 py-3 bg-electric-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Start Live Chat</span>
            </button>
            <button className={`px-6 py-3 rounded-lg border transition-colors flex items-center justify-center space-x-2 ${
              darkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              <Mail className="w-5 h-5" />
              <span>Email Support</span>
            </button>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}

export default HelpView
