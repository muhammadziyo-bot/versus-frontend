import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sword, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const Login = ({ darkMode, onToggleMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, register, loading, error, setError } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate registration fields
    if (!isLogin) {
      // Validate username
      const username = formData.username;
      if (username.length < 3) {
        setFormError('Username must be at least 3 characters long');
        return;
      }
      if (username.length > 30) {
        setFormError('Username must not exceed 30 characters');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setFormError('Username can only contain letters, numbers, underscores, and hyphens');
        return;
      }

      // Validate password
      const password = formData.password;
      if (password.length < 8) {
        setFormError('Password must be at least 8 characters long');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setFormError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(password)) {
        setFormError('Password must contain at least one lowercase letter');
        return;
      }
      if (!/\d/.test(password)) {
        setFormError('Password must contain at least one digit');
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setFormError('Password must contain at least one special character');
        return;
      }
    }

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        await register(formData);
      }
    } catch (error) {
      setFormError(error.detail || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      username: '',
      full_name: ''
    });
    setFormError('');
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center mb-2">
          <Sword className={`w-8 h-8 ${darkMode ? 'text-electric-blue' : 'text-blue-600'}`} />
        </div>
        <h1 className={`text-xl font-bold mb-1 ${darkMode ? 'text-off-white' : 'text-gray-900'}`}>
          {isLogin ? 'Welcome Back' : 'Join Digital Arena'}
        </h1>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {isLogin ? 'Sign in to continue debating' : 'Create your account to start debating'}
        </p>
      </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-1.5 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-off-white focus:border-electric-blue'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-1.5 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-off-white focus:border-electric-blue'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="Enter your full name"
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-off-white focus:border-electric-blue'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-off-white focus:border-electric-blue'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {(formError || error) && (
            <div className={`p-3 rounded-lg text-sm ${
              darkMode ? 'bg-red-900/20 text-red-400 border border-red-800' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {formError || error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-1.5 px-4 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : darkMode
                  ? 'bg-electric-blue text-white hover:bg-blue-600'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-3 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleMode}
              className={`ml-1 font-medium ${darkMode ? 'text-electric-blue hover:text-blue-400' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Dark Mode Toggle */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onToggleMode}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
    </div>
  );
};

export default Login;
