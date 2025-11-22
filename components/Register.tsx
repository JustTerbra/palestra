
import React, { useState } from 'react';
import Input from './common/Input';
import Button from './common/Button';
import { motion } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';
import { LoaderIcon, ArrowLeftIcon } from './common/Icons';

interface RegisterProps {
  onRegisterSuccess: (username: string) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useLocalStorage<User[]>('app_users', []);

  const handleSupabaseRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      
      try {
          const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                  data: {
                      full_name: fullName
                  }
              }
          });
          
          if (error) throw error;
          
          if (data.session) {
             // Session handled by App.tsx
          } else if (data.user) {
              setError("Success! Please check your email to verify.");
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  }

  const handleLegacyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (fullName.length < 3) { setError("Username must be 3+ chars"); return; }
    if (password.length < 6) { setError("Password must be 6+ chars"); return; }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const existing = users.find(u => u.username.toLowerCase() === fullName.toLowerCase());
    if (existing) {
        setError("Username taken.");
        setIsLoading(false);
        return;
    }
    setUsers(prev => [...prev, { username: fullName, password }]);
    onRegisterSuccess(fullName);
    setIsLoading(false);
  };

  const handleSubmit = isSupabaseConfigured() ? handleSupabaseRegister : handleLegacyRegister;

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />

        <div className="mb-6">
            <button 
                onClick={onSwitchToLogin}
                className="text-gray-500 hover:text-white transition-colors flex items-center text-sm mb-4"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Login
            </button>
            <h2 className="text-3xl font-bold text-white tracking-tight font-righteous">Create Account</h2>
            <p className="text-gray-400 mt-2 text-sm">
                Begin your fitness journey today.
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
             <Input
                label={isSupabaseConfigured() ? "Email Address" : "Username"}
                id="email"
                type={isSupabaseConfigured() ? "email" : "text"}
                value={isSupabaseConfigured() ? email : fullName}
                onChange={(e) => isSupabaseConfigured() ? setEmail(e.target.value) : setFullName(e.target.value)}
                required
                placeholder={isSupabaseConfigured() ? "you@example.com" : "Choose a username"}
                className="!bg-white/5 !border-white/10 focus:!border-violet-500 !py-3 !rounded-xl placeholder:text-gray-600"
            />
            {isSupabaseConfigured() && (
                 <Input
                    label="Full Name"
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="!bg-white/5 !border-white/10 focus:!border-violet-500 !py-3 !rounded-xl placeholder:text-gray-600"
                />
            )}
            <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a strong password"
                className="!bg-white/5 !border-white/10 focus:!border-violet-500 !py-3 !rounded-xl placeholder:text-gray-600"
            />
            
             {error && (
                <motion.div 
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className={`p-3 rounded-lg border text-sm text-center ${error.includes('Success') ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-red-500/10 border-red-500/20 text-red-200'}`}
                >
                    {error}
                </motion.div>
            )}

            <Button type="submit" className="w-full py-3.5 text-base rounded-xl shadow-lg shadow-violet-500/25 mt-2" disabled={isLoading}>
                 {isLoading ? <LoaderIcon className="h-5 w-5 animate-spin mx-auto" /> : 'Create Account'}
            </Button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-semibold text-violet-400 hover:text-violet-300 transition-colors ml-1">
                    Sign In
                </button>
            </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
