import { useState, useEffect } from 'react';
import { UserSession } from './types';
import SaaSLandingPage from './components/SaaSLandingPage';
import SaaSDashboard from './components/SaaSDashboard';
import AuthViews from './components/AuthViews';
import { saasApi, removeAuthToken } from './lib/authSupport';
import { motion, AnimatePresence } from 'motion/react';
import DundeeWorkspace from './components/storyboard/DundeeWorkspace';
import GlobalStatusBar from './components/GlobalStatusBar';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [viewState, setViewState] = useState<'landing' | 'saas-portal' | 'drawing-gallery'>('landing');

  // Sync session on mount
  const fetchCurrentUser = async () => {
    try {
      let userObj = await saasApi.getMe().catch(() => null);
      if (userObj) {
        setCurrentUser(userObj);
        setViewState('saas-portal');
      } else {
        setViewState('landing');
      }
    } catch (err) {
      setViewState('landing');
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleRefreshUser = async () => {
    try {
      const userObj = await saasApi.getMe();
      if (userObj) {
        setCurrentUser(userObj);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setViewState('landing');
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center font-sans" id="canvas-loader-screen">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 animate-spin flex items-center justify-center shadow-lg" />
        <span className="text-xs text-zinc-500 font-bold mt-4 font-mono tracking-widest uppercase">Initializing Dundee Studio...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-black overflow-hidden selection:bg-emerald-500 selection:text-black">
      <AnimatePresence mode="wait">
        
        {viewState === 'landing' && (
          <motion.div
            key="landing-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <SaaSLandingPage 
              onOpenAuth={() => setShowAuthModal(true)} 
              onLaunchGuestMode={async () => {
                try {
                  localStorage.setItem('canvas_saas_token', 'guest-token');
                  const userObj = await saasApi.getMe();
                  if (userObj) {
                    setCurrentUser(userObj);
                  }
                } catch (e) {
                  console.error('Guest session init failure:', e);
                  setCurrentUser({
                    id: 'u-guest-00',
                    name: 'Guest Director',
                    email: 'guest@dundeestudio.com',
                    phone: '',
                    role: 'user',
                    package_type: 'FREE',
                    tokens_remaining: 5000,
                    total_tokens_used: 0,
                    api_provider: 'gemini-3.5-flash',
                    account_status: 'ACTIVE',
                    created_at: new Date().toISOString()
                  } as any);
                }
                setViewState('drawing-gallery');
              }}
            />
          </motion.div>
        )}

        {viewState === 'saas-portal' && currentUser && (
          <motion.div
            key="saas-portal-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <SaaSDashboard 
              user={currentUser}
              onLogout={handleLogout}
              onRefreshUser={handleRefreshUser}
              onLaunchCanvas={() => setViewState('drawing-gallery')}
              projectsCount={0}
            />
          </motion.div>
        )}

        {viewState === 'drawing-gallery' && (
          <motion.div
            key="canvas-gallery-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-screen flex flex-col items-stretch overflow-hidden animate-fade-in"
          >
            <DundeeWorkspace 
              userSession={currentUser}
              onRefreshUser={handleRefreshUser}
              onBackToDashboard={() => {
                if (currentUser) setViewState('saas-portal');
                else setViewState('landing');
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full z-10 overflow-hidden"
              id="global-auth-modal-overlay"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-xs font-bold text-zinc-500 hover:text-white cursor-pointer p-1"
              >
                ✕
              </button>
              
              <AuthViews 
                onAuthSuccess={(sessionUser) => {
                  setCurrentUser(sessionUser);
                  setViewState('saas-portal');
                  setShowAuthModal(false);
                }}
                onClose={() => setShowAuthModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Global Bottom Status Bar */}
      <GlobalStatusBar currentUser={currentUser} onRefreshUser={handleRefreshUser} />

    </div>
  );
}
