import React, { useState, useEffect } from 'react';
import { geminiApi } from '../api/geminiApi';
import { AlertCircle, ShieldCheck, RefreshCw, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface APIHealthMonitorProps {
  onValidated?: () => void;
  onDismiss?: () => void;
  componentName?: string;
}

export default function APIHealthMonitor({ onValidated, onDismiss, componentName = 'Workspace' }: APIHealthMonitorProps) {
  const [status, setStatus] = useState<'loading' | 'healthy' | 'unhealthy'>('loading');
  const [errorDetails, setErrorDetails] = useState<{
    reason?: string;
    message: string;
  } | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkApiHealth = async () => {
    setStatus('loading');
    setErrorDetails(null);
    try {
      const response = await geminiApi.checkHealth();
      setLastChecked(new Date());
      if (response.status === 'healthy') {
        setStatus('healthy');
        if (onValidated) {
          onValidated();
        }
      } else {
        setStatus('unhealthy');
        setErrorDetails({
          reason: response.reason,
          message: response.message
        });
      }
    } catch (err: any) {
      setLastChecked(new Date());
      setStatus('unhealthy');
      setErrorDetails({
        reason: 'network_error',
        message: err.message || 'Failed to ping server-side API health monitor endpoints.'
      });
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  if (status === 'healthy' || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-zinc-100"
        id="api-health-monitor-alert-box"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
        
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-950/60 border border-red-900/40 rounded-xl flex items-center justify-center text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Developer Warning</span>
              <h3 className="text-sm font-bold text-white tracking-tight -mt-0.5">Gemini API Key Unhealthy</h3>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => {
                setIsDismissed(true);
                if (onDismiss) onDismiss();
              }}
              className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
              title="Proceed anyway (Sandbox bypass)"
              id="api-health-dismiss-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Breakdown Panel */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 mb-5 text-sm">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800/50 pb-2">
            <span className="text-zinc-400 text-xs font-semibold">Gemini Live Connection Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
              status === 'loading'
                ? 'bg-zinc-800 text-zinc-400'
                : 'bg-red-950/80 text-red-400 border border-red-900/40'
            }`}>
              {status === 'loading' ? 'CHECKING...' : 'UNHEALTHY'}
            </span>
          </div>

          <div className="space-y-2">
            {status === 'loading' ? (
              <div className="flex items-center gap-2 text-zinc-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-xs font-medium font-mono">Running connection verification probes...</span>
              </div>
            ) : (
              <>
                <div className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-900/30 p-2.5 rounded-xl border border-zinc-900">
                  <p className="font-bold text-amber-500/90 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-mono">
                    Diagnostic Report:
                  </p>
                  <p className="text-zinc-300 select-text font-mono text-[11px] mb-2 font-medium break-words">
                    {errorDetails?.message}
                  </p>
                  <div className="text-[11px] text-zinc-500 mt-1 select-text">
                    <span className="font-semibold text-zinc-400">Failure Signature:</span> {errorDetails?.reason || 'unspecified_error'}
                  </div>
                </div>

                {lastChecked && (
                  <p className="text-[10px] text-zinc-500 pt-1 font-mono">
                    Last probe run: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Instructional Steps card based on the environment rules */}
        <div className="bg-amber-950/20 border border-amber-900/20 text-amber-200/90 rounded-2xl p-4 mb-5 text-[11px] leading-relaxed">
          <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5" /> How to resolve:
          </span>
          <p className="mb-2">
            The Gemini model requires a valid <code className="font-mono text-amber-300">GEMINI_API_KEY</code> loaded server-side.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400">
            <li>Open the app <span className="font-semibold text-zinc-200">Settings</span> panel in AI Studio.</li>
            <li>Select <span className="font-semibold text-zinc-200">Environment Variables</span>.</li>
            <li>Define <code className="font-mono text-cyan-400">GEMINI_API_KEY</code> with your Google Gemini API Key.</li>
          </ol>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 justify-end pt-1">
          {onDismiss && (
            <button
              onClick={() => {
                setIsDismissed(true);
                if (onDismiss) onDismiss();
              }}
              className="px-3.5 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              id="api-health-monitor-dismiss-action"
            >
              Skip (Sandbox Offline Mode)
            </button>
          )}
          <button
            onClick={checkApiHealth}
            disabled={status === 'loading'}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 font-sans text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-black/10"
            id="api-health-monitor-retry-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
            Run Validation Probes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
