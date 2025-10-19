import React, { useState, useEffect } from 'react';
import { AppView, User } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExerciseTracker from './components/ExerciseTracker';
import NutritionTracker from './components/NutritionTracker';
import Login from './components/Login';
import Register from './components/Register';
import useLocalStorage from './hooks/useLocalStorage';
import { AnimatePresence, motion } from 'framer-motion';
import StreaksPage from './components/StreaksPage';

const App: React.FC = () => {
  const [view, setView] = useLocalStorage<AppView>('appView', 'DASHBOARD');
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('currentUser', null);
  const [users, setUsers] = useLocalStorage<User[]>('app_users', []);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Seed the user database from the JSON file if it's empty
    if (users.length === 0) {
      fetch('/data/users.json')
        .then(res => res.json())
        .then(seedData => {
           setUsers(seedData);
        })
        .catch(err => console.error("Failed to seed user data:", err));
    }
  }, []);

  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setView('DASHBOARD');
    setAuthView('login'); // Reset to login view on logout
  };

  const renderView = () => {
    const pageVariants = {
      initial: { opacity: 0, y: 20 },
      in: { opacity: 1, y: 0 },
      out: { opacity: 0, y: -20 },
    };
    const pageTransition = {
      type: 'tween',
      ease: 'anticipate',
      duration: 0.5,
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {view === 'EXERCISE' && <ExerciseTracker />}
          {view === 'NUTRITION' && <NutritionTracker />}
          {view === 'STREAKS' && <StreaksPage setView={setView} />}
          {view === 'DASHBOARD' && <Dashboard setView={setView} currentUser={currentUser!} />}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (!currentUser) {
    const authContainerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
        exit: { opacity: 0, transition: { duration: 0.3 } },
    }
    return (
       <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
            <AnimatePresence mode="wait">
                {authView === 'login' ? (
                    <motion.div
                        key="login"
                        variants={authContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthView('register')} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="register"
                        variants={authContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <Register onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setAuthView('login')} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-['Inter',_sans-serif]">
      <Header currentView={view} setView={setView} onLogout={handleLogout} />
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;