import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ValidationUtils } from '../utils/validation';
import { Eye, EyeOff } from 'lucide-react';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Email validation
    if (!ValidationUtils.isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation for sign up
    if (isSignUp) {
      const passwordValidation = ValidationUtils.isValidPassword(password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.message || 'Invalid password';
      }

      // Name validation
      if (!ValidationUtils.isValidName(name)) {
        errors.name = 'Name must be between 2-50 characters';
      }
    } else {
      // For sign in, just check password exists
      if (!password.trim()) {
        errors.password = 'Password is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize inputs
      const sanitizedEmail = ValidationUtils.sanitizeText(email);
      const sanitizedName = ValidationUtils.sanitizeText(name);

      if (isSignUp) {
        await signUp(sanitizedEmail, password, sanitizedName);
        navigate('/dashboard');
      } else {
        await signIn(sanitizedEmail, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-gray-900">
              {isSignUp ? 'Create Account' : 'Welcome back'}
            </h1>
            <p className="text-gray-600">
              {isSignUp
                ? 'Join us to start your wellness journey...'
                : 'We are here to help every step of the way...'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 ${validationErrors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  required
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>
            )}

            <div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-4 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 ${validationErrors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  required
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  @
                </div>
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full px-4 py-4 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 ${validationErrors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
              {isSignUp && !validationErrors.password && password && (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) ? 'text-green-600' : 'text-gray-500'}>Contains uppercase, lowercase & number</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-600 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Sign Up'
                  : 'Log In'}
            </button>
          </form>

          {!isSignUp && (
            <div className="text-center">
              <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                Forgot your password?
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Social Sign In */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-gray-700 font-medium">Sign in with Google</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-gray-700 font-medium">Sign in with Apple</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <span className="text-gray-600">
              {isSignUp ? 'Already have account?' : "Don't have an account?"}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat relative overflow-hidden"
          style={{
            backgroundImage: `url('./Rectangle 7.png')`
          }}
        >
          {/* Testimonials */}
          <div className="absolute bottom-8 left-8 right-8">
            {/* Main container matching Figma specs */}
            <div className="flex flex-row items-center gap-2 w-[274px] h-[43.61px]">
              {/* Avatars container */}
              <div className="flex flex-row justify-center items-center w-[125.77px] h-[35.93px] relative">
                {/* Avatar 1 */}
                <div
                  className="w-[35.93px] h-[35.93px] bg-white border-[1.12px] border-[#FAF7F0] rounded-full relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 hover:shadow-lg hover:shadow-white/50 hover:-translate-y-1"
                  style={{ zIndex: 5, marginRight: '-13.48px' }}
                >
                  <img
                    src="https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=72&h=72&fit=crop&crop=face"
                    alt="User avatar"
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:brightness-110"
                  />
                </div>

                {/* Avatar 2 */}
                <div
                  className="w-[35.93px] h-[35.93px] bg-white border-[1.12px] border-[#FAF7F0] rounded-full relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 hover:shadow-lg hover:shadow-white/50 hover:-translate-y-1"
                  style={{ zIndex: 4, marginRight: '-13.48px' }}
                >
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=72&h=72&fit=crop&crop=face"
                    alt="User avatar"
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:brightness-110"
                  />
                </div>

                {/* Avatar 3 */}
                <div
                  className="w-[35.93px] h-[35.93px] bg-white border-[1.12px] border-[#FAF7F0] rounded-full relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 hover:shadow-lg hover:shadow-white/50 hover:-translate-y-1"
                  style={{ zIndex: 3, marginRight: '-13.48px' }}
                >
                  <img
                    src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=72&h=72&fit=crop&crop=face"
                    alt="User avatar"
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:brightness-110"
                  />
                </div>

                {/* Avatar 4 */}
                <div
                  className="w-[35.93px] h-[35.93px] bg-white border-[1.12px] border-[#FAF7F0] rounded-full relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 hover:shadow-lg hover:shadow-white/50 hover:-translate-y-1"
                  style={{ zIndex: 2, marginRight: '-13.48px' }}
                >
                  <img
                    src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=72&h=72&fit=crop&crop=face"
                    alt="User avatar"
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:brightness-110"
                  />
                </div>

                {/* Avatar 5 */}
                <div
                  className="w-[35.93px] h-[35.93px] bg-white border-[1.12px] border-[#FAF7F0] rounded-full relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 hover:shadow-lg hover:shadow-white/50 hover:-translate-y-1"
                  style={{ zIndex: 1 }}
                >
                  <img
                    src="https://images.pexels.com/photos/5207098/pexels-photo-5207098.jpeg?auto=compress&cs=tinysrgb&w=72&h=72&fit=crop&crop=face"
                    alt="User avatar"
                    className="w-full h-full object-cover transition-all duration-300 ease-in-out hover:brightness-110"
                  />
                </div>
              </div>

              {/* Rating section */}
              <div className="flex flex-col items-start gap-[5.61px] w-[140.37px] h-[43.61px]">
                {/* Stars and rating */}
                <div className="flex flex-row items-end gap-[11.23px] w-[140.37px] h-[19px]">
                  {/* Stars */}
                  <div className="flex items-center w-[105.5px] h-[18.42px]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-[18.42px] h-[18.42px] text-yellow-400 fill-current transition-all duration-200 ease-in-out hover:scale-110 hover:drop-shadow-lg hover:text-yellow-300 cursor-pointer"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Rating number */}
                  <span className="text-white font-normal text-[15.72px] leading-[19px] text-center w-[24px] h-[19px] transition-all duration-200 ease-in-out hover:scale-105 drop-shadow-md">
                    4.5
                  </span>
                </div>

                {/* Reviews text */}
                <p className="text-white font-normal text-[15.72px] leading-[19px] text-center w-[140.37px] h-[19px] transition-all duration-200 ease-in-out hover:text-opacity-80 drop-shadow-md">
                  from 200+ reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}