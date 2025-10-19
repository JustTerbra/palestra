import React, { useState } from 'react';
import Input from './common/Input';
import Button from './common/Button';
import Card from './common/Card';
import { motion } from 'framer-motion';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';

interface RegisterProps {
  onRegisterSuccess: (username: string) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useLocalStorage<User[]>('app_users', []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const existingUser = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );

      if (existingUser) {
        setError('That username is already taken. Please choose another.');
        setIsLoading(false);
        return;
      }
      
      const newUser: User = { username, password };
      setUsers(prevUsers => [...prevUsers, newUser]);
      onRegisterSuccess(username);

    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error(err);
      setIsLoading(false);
    }
  };

 const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
    >
        <Card className="!p-8">
            <motion.h1 
                variants={itemVariants} 
                className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400"
            >
                Create Account
            </motion.h1>
            <motion.p
                variants={itemVariants}
                className="text-gray-400 text-center mb-8"
            >
                Start your fitness journey today.
            </motion.p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants}>
                    <Input
                    label="Username"
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Input
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </motion.div>
                {error && (
                    <motion.p 
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        className="text-red-400 text-sm text-center"
                    >
                        {error}
                    </motion.p>
                )}
                <motion.div variants={itemVariants}>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Register'}
                    </Button>
                </motion.div>
                 <motion.div variants={itemVariants} className="text-center text-sm text-gray-400 pt-4">
                    <p>
                        Already have an account?{' '}
                        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-violet-400 hover:text-violet-300 transition-colors focus:outline-none">
                            Log in
                        </button>
                    </p>
                </motion.div>
            </form>
        </Card>
    </motion.div>
  );
};

export default Register;
