
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExerciseTracker from './components/ExerciseTracker';
import NutritionTracker from './components/NutritionTracker';
import Login from './components/Login';
import Register from './components/Register';
import { AnimatePresence, motion, Variants, Transition } from 'framer-motion';
import StreaksPage from './components/StreaksPage';
import { supabase, isSupabaseConfigured } from './services/supabase';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [view, setView] = useLocalStorage<AppView>('appView', 'DASHBOARD');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  // Supabase Auth State
  const [session, setSession] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoadingAuth(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsLoadingAuth(false);
        });

        return () => subscription.unsubscribe();
    } else {
        setIsLoadingAuth(false);
    }
  }, []);

  // Legacy local auth fallback for when Supabase isn't configured
  const [localUser, setLocalUser] = useLocalStorage<string | null>('currentUser', null);
  
  const currentUser = session?.user 
    ? (session.user.user_metadata.full_name || session.user.email?.split('@')[0]) 
    : localUser;
  
  const userId = session?.user?.id || (localUser ? 'local_user' : undefined);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
    }
    setLocalUser(null);
    setView('DASHBOARD');
    setAuthView('login');
  };

  const renderView = () => {
    const pageVariants: Variants = {
      initial: { opacity: 0, y: 20 },
      in: { opacity: 1, y: 0 },
      out: { opacity: 0, y: -20 },
    };
    const pageTransition: Transition = {
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
          {view === 'EXERCISE' && <ExerciseTracker userId={userId} />}
          {view === 'NUTRITION' && <NutritionTracker userId={userId} />}
          {view === 'STREAKS' && <StreaksPage setView={setView} userId={userId} />}
          {view === 'DASHBOARD' && <Dashboard setView={setView} currentUser={currentUser} userId={userId} />}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (isLoadingAuth) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
          </div>
      )
  }

  if (!currentUser) {
    const authContainerVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } },
    }
    return (
       <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>
            
            <div className="relative z-10 w-full max-w-md p-4">
                <AnimatePresence mode="wait">
                    {authView === 'login' ? (
                        <motion.div
                            key="login"
                            variants={authContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <Login onLoginSuccess={(u) => setLocalUser(u)} onSwitchToRegister={() => setAuthView('register')} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="register"
                            variants={authContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <Register onRegisterSuccess={(u) => { setLocalUser(u); setAuthView('login'); }} onSwitchToLogin={() => setAuthView('login')} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black bg-fixed bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 font-['Inter',_sans-serif]">
      <Header currentView={view} setView={setView} onLogout={handleLogout} />
      <main className="container mx-auto p-4 sm:p-6 md:p-8 pb-24">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
