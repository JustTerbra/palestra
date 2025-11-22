
import React, { useState } from 'react';
import Input from './common/Input';
import Button from './common/Button';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';
import { LoaderIcon } from './common/Icons';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
  onSwitchToRegister: () => void;
}

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users] = useLocalStorage<User[]>('app_users', []);

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    } catch (err: any) {
        setError(err.message || 'Failed to login');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
      if (!isSupabaseConfigured()) {
          setError("Google Login requires Supabase configuration.");
          return;
      }
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                  redirectTo: window.location.origin
              }
          });
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
      }
  };

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = users.find((u) => u.username === email && u.password === password);
    if (user) {
      onLoginSuccess(user.username);
    } else {
      setError('Invalid username or password (Local Mode).');
    }
    setIsLoading(false);
  };

  const handleSubmit = isSupabaseConfigured() ? handleSupabaseLogin : handleLegacyLogin;

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Light Effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />

        <div className="text-center mb-8">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/20 mb-5"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </motion.div>
            <h2 className="text-3xl font-bold text-white tracking-tight font-righteous">Welcome back</h2>
            <p className="text-gray-400 mt-2 text-sm">
                {isSupabaseConfigured() ? "Sign in to continue your progress" : "Local Mode: Database disconnected"}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-4">
                <Input
                    label={isSupabaseConfigured() ? "Email Address" : "Username"}
                    id="email"
                    type={isSupabaseConfigured() ? "email" : "text"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={isSupabaseConfigured() ? "you@example.com" : "Your username"}
                    className="!bg-white/5 !border-white/10 focus:!border-violet-500 !py-3 !rounded-xl placeholder:text-gray-600"
                />
                <Input
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="!bg-white/5 !border-white/10 focus:!border-violet-500 !py-3 !rounded-xl placeholder:text-gray-600"
                />
            </div>
            
            {error && (
                <motion.div 
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: 'auto'}}
                    className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2"
                >
                    {error}
                </motion.div>
            )}

            <Button type="submit" className="w-full py-3.5 text-base rounded-xl shadow-lg shadow-violet-500/25 mt-2" disabled={isLoading}>
                {isLoading ? <LoaderIcon className="h-5 w-5 animate-spin mx-auto" /> : 'Sign In'}
            </Button>
        </form>

        <div className="mt-8">
            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="px-4 bg-transparent text-gray-500 bg-black/50 backdrop-blur-sm rounded-full">Or continue with</span>
                </div>
            </div>

            <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-sm font-medium text-gray-300 group"
            >
                <div className="mr-3 group-hover:scale-110 transition-transform">
                    <GoogleIcon />
                </div>
                Google
            </button>
        </div>

        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
                New to TerbrasFit?{' '}
                <button 
                    onClick={onSwitchToRegister} 
                    className="font-semibold text-violet-400 hover:text-violet-300 transition-colors ml-1"
                >
                    Create Account
                </button>
            </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
