import React, { useState, useEffect } from 'react';
import { Settings, Cloud, Download, Key, Save, Server, Loader2, CloudUpload } from 'lucide-react';
import { geminiApi } from '../../api/geminiApi';

interface SettingsTabProps {
  onExportLocalData: () => void;
  getWorkspaceData: () => any;
  onImportWorkspaceData: (data: any) => void;
}

export default function SettingsTab({ onExportLocalData, getWorkspaceData, onImportWorkspaceData }: SettingsTabProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState<string | null>(null);

  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load custom key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('dundee_custom_gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    setIsSavingKey(true);
    setKeyMessage(null);
    setTimeout(() => {
      if (apiKey.trim()) {
        localStorage.setItem('dundee_custom_gemini_key', apiKey.trim());
        setKeyMessage('API Key securely saved to your local browser storage.');
      } else {
        localStorage.removeItem('dundee_custom_gemini_key');
        setKeyMessage('Custom API Key removed. Using server default.');
      }
      setIsSavingKey(false);
    }, 500);
  };

  const handleCloudSave = async () => {
    setCloudLoading(true);
    setCloudMessage(null);
    try {
      const workspaceData = getWorkspaceData();
      const res = await geminiApi.saveCloudData(workspaceData);
      if (res.simulated) {
        setCloudMessage({ type: 'success', text: 'Simulated Save (Google Cloud Storage not fully configured with ADC).' });
      } else {
        setCloudMessage({ type: 'success', text: 'Workspace successfully saved to Google Cloud Storage!' });
      }
    } catch (err: any) {
      setCloudMessage({ type: 'error', text: err.message || 'Failed to save to Cloud Storage' });
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudLoad = async () => {
    setCloudLoading(true);
    setCloudMessage(null);
    try {
      const res = await geminiApi.loadCloudData();
      if (res.data) {
        onImportWorkspaceData(res.data);
        setCloudMessage({ type: 'success', text: 'Workspace loaded from Google Cloud Storage!' });
      } else {
        setCloudMessage({ type: 'error', text: res.message || 'No saved cloud data found.' });
      }
    } catch (err: any) {
      setCloudMessage({ type: 'error', text: err.message || 'Failed to load from Cloud Storage' });
    } finally {
      setCloudLoading(false);
    }
  };

  return (
    <div className="h-full bg-slate-900 overflow-y-auto p-6 flex justify-center">
      <div className="max-w-3xl w-full space-y-8 pb-32">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-black text-white flex items-center gap-2 font-sans tracking-tight">
            <Settings className="w-6 h-6 text-indigo-500" />
            Workspace Settings
          </h2>
          <p className="text-slate-400 text-sm mt-1">Configure your API access and manage your workspace cloud backups.</p>
        </div>

        {/* Bring Your Own Key Section */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Custom Gemini API Key
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-lg">
                Bypass standard package quotas by using your own Google Gemini API Key. Your key is stored locally in your browser and never saved in our database.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input 
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSaveKey}
              disabled={isSavingKey}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shrink-0"
            >
              {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Key
            </button>
          </div>

          {keyMessage && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
              <Key className="w-4 h-4" /> {keyMessage}
            </div>
          )}
        </div>

        {/* Data Persistence Section */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Data Persistence & Backups
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Your workspace auto-saves locally, but you can explicitly backup your project to Google Cloud Storage or export it as a JSON file.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cloud Storage Panel */}
            <div className="bg-slate-900/50 border border-indigo-500/20 p-5 rounded-xl flex flex-col">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Cloud className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wider">Google Cloud Storage</h4>
              </div>
              <p className="text-xs text-slate-500 mb-6 flex-1">
                Sync your project directly to your account's secure Google Cloud bucket.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCloudSave}
                  disabled={cloudLoading}
                  className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <CloudUpload className="w-3.5 h-3.5" /> Save to Cloud
                </button>
                <button
                  onClick={handleCloudLoad}
                  disabled={cloudLoading}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Load from Cloud
                </button>
              </div>
            </div>

            {/* Local Export Panel */}
            <div className="bg-slate-900/50 border border-slate-700 p-5 rounded-xl flex flex-col">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Save className="w-5 h-5" />
                <h4 className="font-bold text-sm uppercase tracking-wider">Local JSON Export</h4>
              </div>
              <p className="text-xs text-slate-500 mb-6 flex-1">
                Download a complete copy of your workspace data to your hard drive.
              </p>
              
              <button
                onClick={onExportLocalData}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Workspace .json
              </button>
            </div>
            
          </div>

          {cloudLoading && (
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Synchronizing with Google Cloud...
            </div>
          )}

          {cloudMessage && !cloudLoading && (
            <div className={`mt-4 p-3 border rounded-xl text-sm flex items-center gap-2 ${
              cloudMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <Cloud className="w-4 h-4" /> {cloudMessage.text}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
