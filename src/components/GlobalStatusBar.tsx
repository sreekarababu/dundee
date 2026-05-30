import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Save, CheckCircle, RefreshCw, Coins, Zap } from 'lucide-react';
import { saasApi, getAuthToken } from '../lib/authSupport';
import { geminiApi } from '../api/geminiApi';

interface GlobalStatusBarProps {
  currentUser: any;
  onRefreshUser?: () => void;
}

export default function GlobalStatusBar({ currentUser, onRefreshUser }: GlobalStatusBarProps) {
  const [connection, setConnection] = useState<'checking' | 'connected' | 'simulation'>('checking');
  const [autosaveEnabled, setAutosaveEnabled] = useState(() => {
    return localStorage.getItem('dundee_autosave_enabled') !== 'false';
  });
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [justSaved, setJustSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync token count on user changes
  useEffect(() => {
    if (currentUser) {
      setTokensUsed(currentUser.total_tokens_used || 0);
    } else {
      setTokensUsed(0);
    }
  }, [currentUser]);

  // Poll for token updates periodically if logged in
  useEffect(() => {
    let intervalId: any;
    if (getAuthToken()) {
      intervalId = setInterval(async () => {
        try {
          const userObj = await saasApi.getMe();
          if (userObj) {
            setTokensUsed(userObj.total_tokens_used || 0);
          }
        } catch (e) {
          // ignore background errors
        }
      }, 10000); // every 10 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Ping Gemini health on launch and on retry
  const verifyApiKeyHealth = async () => {
    setIsRefreshing(true);
    try {
      const response = await geminiApi.checkHealth();
      if (response && response.status === 'healthy') {
        setConnection('connected');
      } else {
        setConnection('simulation');
      }
    } catch (err) {
      setConnection('simulation');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    verifyApiKeyHealth();
  }, []);

  // Listen for storage / custom save notifications
  useEffect(() => {
    const handleAutosavedEvent = () => {
      setJustSaved(true);
      const timer = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(timer);
    };

    const handleAutosaveConfigChange = () => {
      const currentAutosave = localStorage.getItem('dundee_autosave_enabled') !== 'false';
      setAutosaveEnabled(currentAutosave);
    };

    window.addEventListener('dundee_autosaved', handleAutosavedEvent);
    window.addEventListener('dundee_autosave_change', handleAutosaveConfigChange);
    window.addEventListener('storage', handleAutosaveConfigChange);

    return () => {
      window.removeEventListener('dundee_autosaved', handleAutosavedEvent);
      window.removeEventListener('dundee_autosave_change', handleAutosaveConfigChange);
      window.removeEventListener('storage', handleAutosaveConfigChange);
    };
  }, []);

  // Handle toggle triggers
  const handleToggleAutosave = () => {
    const nextVal = !autosaveEnabled;
    setAutosaveEnabled(nextVal);
    localStorage.setItem('dundee_autosave_enabled', String(nextVal));
    // Dispatch to update active workspace hooks instantly
    window.dispatchEvent(new Event('dundee_autosave_change'));
  };

  return (
    <footer 
      className="fixed bottom-0 inset-x-0 h-8 bg-zinc-950/90 border-t border-zinc-800/80 backdrop-blur-md px-4 flex items-center justify-between text-[11px] font-mono font-medium text-zinc-400 z-50 select-none"
      id="global-system-footer-status-bar"
    >
      {/* Left section: Connection parameters */}
      <div className="flex items-center gap-4">
        <button 
          onClick={verifyApiKeyHealth}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer group disabled:opacity-50"
          title="Verify API credential state"
          id="status-bar-connection-btn"
        >
          {connection === 'checking' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              <span>Verifying Connection...</span>
            </>
          )}

          {connection === 'connected' && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-zinc-300">Connected <span className="text-[10px] text-zinc-500 font-normal">(Gemini 3.5 Native)</span></span>
            </>
          )}

          {connection === 'simulation' && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <WifiOff className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-zinc-300">Simulation Mode <span className="text-[10px] text-zinc-500 font-normal">(Local Mocking)</span></span>
            </>
          )}
        </button>

        <span className="h-3 w-px bg-zinc-850/80" />

        {/* Current Mode / Provider information */}
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Engine:</span>
          <span className="text-zinc-300 font-bold">{currentUser ? currentUser.package_type : 'GUEST'}</span>
        </div>
      </div>

      {/* Middle section: Auto-Save parameters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Save className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-400">Autosave:</span>
          <button
            onClick={handleToggleAutosave}
            className={`w-8 h-4 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
              autosaveEnabled ? 'bg-emerald-500/80' : 'bg-zinc-800'
            }`}
            id="status-bar-autosave-toggle-switch"
            role="switch"
            aria-checked={autosaveEnabled}
          >
            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
              autosaveEnabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {autosaveEnabled && (
          <div className="flex items-center gap-1 min-w-[130px] justify-start transition-all">
            {justSaved ? (
              <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Changed State Saved</span>
              </span>
            ) : (
              <span className="text-zinc-500 flex items-center gap-1">
                <span>● Saved to Sandbox Storage</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right section: Global Tokens / Credit Usage counter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Token Draw:</span>
          <span className="font-bold text-zinc-100 select-all" id="status-bar-token-used-counter">
            {tokensUsed.toLocaleString()}
          </span>
        </div>
      </div>
    </footer>
  );
}
