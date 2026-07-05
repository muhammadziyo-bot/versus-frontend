import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, TrendingDown, Brain, Clock, Award, Zap, Target, BookOpen, Lightbulb, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import battleService from '../services/battleService'

const BattleResults = ({ battleRoomId, darkMode }) => {
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    pollForResult()
    const interval = setInterval(pollForResult, 3000) // Poll every 3 seconds
    
    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!aiResult) {
        setError('Results are taking longer than expected. Please check back later.')
        setLoading(false)
      }
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [battleRoomId])

  const pollForResult = async () => {
    try {
      setPollCount(prev => prev + 1)
      const result = await battleService.getAIResult(battleRoomId)
      
      if (result) {
        setAiResult(result)
        setLoading(false)
        clearInterval(interval)
      }
    } catch (err) {
      if (err.response?.status === 404) {
        // Results not ready yet, continue polling
        if (pollCount > 20) {
          setError('Results are being calculated. Please wait a moment...')
        }
      } else {
        setError('Failed to load results')
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className={`rounded-lg shadow-md p-8 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-semibold mb-2">Analyzing Debate...</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AI is scoring arguments and generating comprehensive analysis
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Estimated time: 60-90 seconds</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Error Loading Results</h3>
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
      </div>
    )
  }

  if (!aiResult) {
    return null
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-500'
    if (score >= 6) return 'text-blue-500'
    if (score >= 4) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBarColor = (score) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-blue-500'
    if (score >= 4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const winnerText = aiResult.winner_side === 'draw' 
    ? 'It\'s a Draw!' 
    : `${aiResult.winner_side.toUpperCase()} Wins!`

  const winnerColor = aiResult.winner_side === 'pro' 
    ? 'text-blue-600' 
    : aiResult.winner_side === 'con' 
    ? 'text-red-600' 
    : 'text-gray-600'

  return (
    <div className="space-y-6">
      {/* Winner Announcement */}
      <div className={`rounded-lg shadow-md p-8 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${winnerColor}`}>
            {winnerText}
          </h2>
          <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AI-Powered Analysis
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
            <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Brain className="w-4 h-4 inline mr-1" />
              Model: {aiResult.model_used || 'AI'}
            </div>
            <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Target className="w-4 h-4 inline mr-1" />
              Confidence: {aiResult.confidence}/10
            </div>
          </div>
        </div>
      </div>

      {/* Score Comparison */}
      <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Award className="w-6 h-6 mr-2" />
          Final Scores
        </h3>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Pro Score */}
          <div className="text-center">
            <div className="text-sm font-medium text-blue-600 mb-2">PRO</div>
            <div className={`text-4xl font-bold ${getScoreColor(aiResult.pro_total_score / 10)}`}>
              {aiResult.pro_total_score}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Points
            </div>
          </div>
          
          {/* Con Score */}
          <div className="text-center">
            <div className="text-sm font-medium text-red-600 mb-2">CON</div>
            <div className={`text-4xl font-bold ${getScoreColor(aiResult.con_total_score / 10)}`}>
              {aiResult.con_total_score}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Points
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-6">
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
            <div 
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${(aiResult.pro_total_score / (aiResult.pro_total_score + aiResult.con_total_score)) * 100}%` }}
            />
            <div 
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(aiResult.con_total_score / (aiResult.pro_total_score + aiResult.con_total_score)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Round-by-Round Breakdown */}
      {aiResult.round_breakdown && aiResult.round_breakdown.length > 0 && (
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <BookOpen className="w-6 h-6 mr-2" />
            Round-by-Round Analysis
          </h3>
          
          <div className="space-y-6">
            {aiResult.round_breakdown.map((round, index) => (
              <div key={index} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Round {round.round_number}</h4>
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-xs text-blue-600">PRO</div>
                      <div className={`font-bold ${getScoreColor(round.pro_score)}`}>
                        {round.pro_score}/10
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-red-600">CON</div>
                      <div className={`font-bold ${getScoreColor(round.con_score)}`}>
                        {round.con_score}/10
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Analysis */}
                <div className="mb-3">
                  <div className="flex items-center text-sm text-blue-600 mb-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="font-medium">Pro Strengths:</span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {round.pro_strengths || 'No notable strengths identified'}
                  </p>
                </div>

                {/* Pro Weaknesses */}
                <div className="mb-3">
                  <div className="flex items-center text-sm text-red-600 mb-1">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="font-medium">Pro Weaknesses:</span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {round.pro_weaknesses || 'No notable weaknesses identified'}
                  </p>
                </div>

                {/* Con Analysis */}
                <div className="mb-3">
                  <div className="flex items-center text-sm text-blue-600 mb-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="font-medium">Con Strengths:</span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {round.con_strengths || 'No notable strengths identified'}
                  </p>
                </div>

                {/* Con Weaknesses */}
                <div>
                  <div className="flex items-center text-sm text-red-600 mb-1">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    <span className="font-medium">Con Weaknesses:</span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {round.con_weaknesses || 'No notable weaknesses identified'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Analysis */}
      {aiResult.overall_analysis && (
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Lightbulb className="w-6 h-6 mr-2" />
            Comprehensive Analysis
          </h3>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {aiResult.overall_analysis}
            </p>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pro Summary */}
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-600">
            <TrendingUp className="w-5 h-5 mr-2" />
            Pro Performance
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-green-600 mb-1">Strengths</div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {aiResult.pro_strengths || 'No notable strengths identified'}
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-red-600 mb-1">Areas for Improvement</div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {aiResult.pro_weaknesses || 'No notable weaknesses identified'}
              </p>
            </div>
          </div>
        </div>

        {/* Con Summary */}
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-card-bg border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center text-red-600">
            <TrendingUp className="w-5 h-5 mr-2" />
            Con Performance
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-green-600 mb-1">Strengths</div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {aiResult.con_strengths || 'No notable strengths identified'}
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-red-600 mb-1">Areas for Improvement</div>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {aiResult.con_weaknesses || 'No notable weaknesses identified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-start">
          <Brain className="w-5 h-5 mr-2 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-blue-800 mb-1">AI-Powered Analysis</div>
            <p className={`text-blue-700 ${darkMode ? 'text-blue-300' : ''}`}>
              This analysis was generated by AI using only the arguments presented in the debate. 
              Scores are based on logical coherence, evidence quality, clarity, relevance, and counter-argument effectiveness. 
              As your community grows, this will be supplemented with human voting for even more accurate results.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BattleResults
