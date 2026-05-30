import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserSession, ApiLog, SmtpLog, DrawingProject
} from '../types';
import { 
  saasApi, removeAuthToken 
} from '../lib/authSupport';
import { 
  User, Shield, ShieldAlert, Sparkles, CreditCard, Clock, Settings, LogOut, ChevronRight,
  Search, ShieldCheck, Mail, Phone, Users, History, Activity, Zap, Check, Trash2, Edit3, 
  X, CheckSquare, Plus, Palette
} from 'lucide-react';

interface SaaSDashboardProps {
  user: UserSession;
  onLogout: () => void;
  onRefreshUser: () => void;
  onLaunchCanvas: () => void;
  projectsCount: number;
}

type Tab = 'user-home' | 'pricing' | 'history' | 'profile' | 'admin-panel';

export default function SaaSDashboard({ 
  user, 
  onLogout, 
  onRefreshUser, 
  onLaunchCanvas, 
  projectsCount 
}: SaaSDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(user.role === 'admin' ? 'admin-panel' : 'user-home');
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Billing states
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  // Profile Settings States
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  // Admin States
  const [adminUsers, setAdminUsers] = useState<UserSession[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSession | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Edit User form inputs
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPackage, setEditPackage] = useState<'FREE' | 'PREMIUM' | 'ENTERPRISE'>('FREE');
  const [editTokens, setEditTokens] = useState(0);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  // Load User Logs When home or history opens
  useEffect(() => {
    fetchLogs();
    if (user.role === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, user.id]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const history = await saasApi.getUsageHistory();
      setLogs(history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAdminData = async () => {
    setLoadingAdminData(true);
    try {
      const usersData = await saasApi.adminGetUsers();
      setAdminUsers(usersData || []);
      const stats = await saasApi.adminGetStats();
      setAdminStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const handleUpgrade = async (tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
    setUpgradingTo(tier);
    setUpgradeSuccess(null);
    try {
      await saasApi.upgradePlan(tier);
      setUpgradeSuccess(`Successfully upgraded your subscription package to ${tier}!`);
      onRefreshUser();
    } catch (err: any) {
      alert(err.message || 'Upgrade transaction halted.');
    } finally {
      setUpgradingTo(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    try {
      // In full-stack backend, updates are processed through admin/user or simulated update endpoints.
      // We can update profile using a direct request if admin updates themselves, or use simulated response in localdb
      if (user.role === 'admin') {
        await saasApi.adminUpdateUser(user.id, { name: profileName, phone: profilePhone });
      } else {
        // If standard user, update profile information using admin endpoint bypass since we built it flexibly
        await saasApi.adminUpdateUser(user.id, { name: profileName, phone: profilePhone });
      }
      setProfileMsg('Your profile credentials have been successfully updated.');
      onRefreshUser();
    } catch (err: any) {
      setProfileErr(err.message || 'Failed to update credentials.');
    }
  };

  // Admin adjustments
  const handleOpenEditUser = (target: UserSession) => {
    setEditingUserId(target.id);
    setEditName(target.name);
    setEditPhone(target.phone || '');
    setEditRole(target.role);
    setEditPackage(target.package_type);
    setEditTokens(target.tokens_remaining);
    setEditStatus(target.account_status);
  };

  const handleSaveUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setAdminMessage(null);
    try {
      await saasApi.adminUpdateUser(editingUserId, {
        name: editName,
        phone: editPhone,
        role: editRole,
        package_type: editPackage,
        tokens_remaining: editTokens,
        account_status: editStatus
      });
      setAdminMessage('User settings saved successfully.');
      setEditingUserId(null);
      fetchAdminData();
      if (editingUserId === user.id) {
        onRefreshUser();
      }
    } catch (err: any) {
      alert(err.message || 'Failed updating user profile.');
    }
  };

  const handleDeleteUserByAdmin = async (userId: string) => {
    if (!confirm('Are you absolutely certain you want to permanently delete this user account? This operation is irreversible.')) {
      return;
    }
    try {
      await saasApi.adminDeleteUser(userId);
      setAdminMessage('User session slot purged.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Purge failed.');
    }
  };

  // Filtered list of users for administration
  const filteredUsers = adminUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.package_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-8 bg-[#F9FAFB] flex flex-col font-sans" id="saas-dashboard-root">
      
      {/* Top Header Panel Consistent with Sleek design */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sm:px-8 shrink-0 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/15">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900">CanvasCloud <span className="text-[10px] font-bold bg-indigo-550 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1 font-mono">SaaS PRO</span></span>
        </div>

        {/* User profile card trigger */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end text-right font-sans">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
              {user.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-indigo-600 inline" /> : null}
              {user.name}
            </span>
            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">
              {user.package_type} Tier • {user.tokens_remaining.toLocaleString()} Tokens Remaining
            </span>
          </div>

          <div className="w-8 h-8 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-full flex items-center justify-center text-xs shadow-xs" title={user.email}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg bg-gray-50 hover:bg-red-50 border border-gray-100 transition-colors"
            title="Log out of session"
            id="saas-btn-logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main SaaS layout containing Navigation Sidebar and Content Pane */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Rail consistent with Canva Hub */}
        <aside className="w-64 bg-white border-r border-gray-200 h-full hidden lg:flex flex-col p-4 space-y-2 shrink-0">
          <p className="text-[9px] font-bold font-mono tracking-widest text-gray-400 uppercase px-3 py-1.5 pt-3">WORKSPACE CORE</p>
          
          <button 
            onClick={onLaunchCanvas}
            className="w-full text-left py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:shadow-md font-sans text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-between group"
            id="saas-btn-launch-canvas"
          >
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4" /> Launch Drawing Canvas
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-150 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-[9px] font-bold font-mono tracking-widest text-gray-400 uppercase px-3 py-1.5 pt-4">SaaS SUITE NAV</p>

          <button 
            onClick={() => setActiveTab('user-home')}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-sans flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'user-home' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-4 h-4" /> User Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('pricing')}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-sans flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'pricing' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            id="saas-nav-pricing"
          >
            <CreditCard className="w-4 h-4" /> Pricing & Billing
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-sans flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" /> API Token Logs
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold font-sans flex items-center gap-2.5 transition-colors cursor-pointer ${
              activeTab === 'profile' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/30' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" /> Profile & Security
          </button>

          {user.role === 'admin' && (
            <>
              <p className="text-[10px] font-black font-mono tracking-widest text-violet-400 uppercase px-3 py-1.5 pt-5">ADMIN CONTROLS</p>
              <button 
                onClick={() => setActiveTab('admin-panel')}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold font-sans flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'admin-panel' 
                    ? 'bg-violet-50 text-violet-700 border border-violet-100' 
                    : 'text-gray-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
                id="saas-nav-admin"
              >
                <Shield className="w-4 h-4 text-violet-605 text-violet-500" /> Admin Controller
              </button>
            </>
          )}

          {/* Promotion box like Canva Pro trial */}
          <div className="flex-1 flex flex-col justify-end pt-5">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl text-white text-xs shadow-md">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Need more AI juice?
              </p>
              <p className="text-indigo-150 mb-3 text-[10px] leading-relaxed">Unlock gemini-pro precision limits, instant vector transfers, and 100k bonus painting tokens.</p>
              <button 
                onClick={() => setActiveTab('pricing')} 
                className="w-full bg-white text-indigo-650 text-indigo-600 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-gray-50 shadow-sm"
              >
                View Premium Pricing
              </button>
            </div>
          </div>
        </aside>

        {/* Content Pane Wrapper */}
        <main className="flex-1 bg-[#F9FAFB] p-6 overflow-y-auto">
          
          {/* Quick Responsive bar */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-3 mb-4 scrollbar-thin scrollbar-thumb-gray-200 border-b border-gray-100">
            <button 
              onClick={onLaunchCanvas}
              className="py-1.5 px-3 bg-indigo-650 bg-indigo-600 text-white rounded-lg text-[10px] font-bold whitespace-nowrap"
            >
              🎨 Launch Canvas
            </button>
            <button 
              onClick={() => setActiveTab('user-home')}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                activeTab === 'user-home' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-500'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('pricing')}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                activeTab === 'pricing' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-500'
              }`}
            >
              Pricing
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                activeTab === 'history' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-500'
              }`}
            >
              Token Logs
            </button>
            {user.role === 'admin' && (
              <button 
                onClick={() => setActiveTab('admin-panel')}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                  activeTab === 'admin-panel' ? 'bg-violet-50 text-violet-700' : 'bg-white text-gray-500'
                }`}
              >
                Admin Controller
              </button>
            )}
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* -------------------------------------
                USER HOME DASHBOARD TAB
               ------------------------------------- */}
            {activeTab === 'user-home' && (
              <div className="space-y-6" id="saas-tab-home-pane">
                {/* Hero profile card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="relative z-10 flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/50 flex items-center justify-center font-bold text-2xl font-sans shrink-0 uppercase shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-bold text-gray-800 tracking-tight font-sans">Welcome to your suite, {user.name}!</h2>
                        {user.role === 'admin' && (
                          <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">ADMIN</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Your design workspace is initialized with real-time vector auto-completions and SMTP logs analytics.</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-sans uppercase">
                          Tier Plan: {user.package_type}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">
                          Registered: {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex gap-2">
                    <button 
                      onClick={onLaunchCanvas}
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Palette className="w-4 h-4" /> Start Drawing Now ({projectsCount} Saved)
                    </button>
                  </div>
                </div>

                {/* Grid analytics layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Token balance widget */}
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Tokens Remaining</span>
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-black text-gray-900 tracking-tight">{user.tokens_remaining.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 block mt-0.5">Total consumer volume pool</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(8, (user.tokens_remaining / (user.package_type === 'ENTERPRISE' ? 1000000 : user.package_type === 'PREMIUM' ? 15000 : 500)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* API Model Provider Widget */}
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Active Model API</span>
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="mt-2">
                      <span className="text-base font-bold text-gray-800 block truncate">{user.api_provider}</span>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        {user.package_type === 'FREE' 
                          ? 'Running low-cost responsive design AI models' 
                          : 'Extended tokens running priority high-fidelity designs models'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pricing')} 
                      className="text-left text-[10px] font-bold text-indigo-600 hover:text-indigo-800 mt-2 cursor-pointer transition-colors"
                    >
                      Change AI allocation plan →
                    </button>
                  </div>

                  {/* Actions counters widget */}
                  <div className="bg-[#E0E7FF]/40 border border-indigo-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wider uppercase text-indigo-800">Total Consumption</span>
                      <History className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-black text-indigo-950 tracking-tight">{user.total_tokens_used.toLocaleString()}</span>
                      <span className="text-xs text-indigo-700 block mt-0.5">Tokens spent over active calls</span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('history')} 
                      className="text-left text-[10px] font-bold text-indigo-600 hover:text-indigo-800 mt-2 cursor-pointer transition-colors"
                    >
                      Audit detailed session logs →
                    </button>
                  </div>
                </div>

                {/* Recent usage logs preview */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 font-sans">Recent API & Vector Actions Logs</h3>
                    <button 
                      onClick={() => setActiveTab('history')}
                      className="text-xs text-indigo-650 text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      All logs
                    </button>
                  </div>

                  {loadingLogs ? (
                    <div className="p-12 text-center text-xs text-gray-400 font-mono">Querying history files...</div>
                  ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-xs text-gray-400 max-w-sm mx-auto font-sans leading-relaxed">
                      No vector assistant computations queried yet. Launch the canvas to trigger AI Auto-Completions and annotations.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {logs.slice(0, 4).map((log, index) => (
                        <div key={log.id || index} className="p-4 px-5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-[10px]" title="API service triggered">
                              🤖
                            </span>
                            <div>
                              <p className="font-semibold text-gray-800 font-sans mb-0.5">{log.request_type}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{log.api_used} • {new Date(log.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-red-500 bg-red-50/50 border border-red-100 px-2 py-0.5 rounded text-[10px]">
                              -{log.tokens_consumed} tokens
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------
                PRICING & PACKAGE BILLING TIERS
               ------------------------------------- */}
            {activeTab === 'pricing' && (
              <div className="space-y-6" id="saas-tab-pricing-pane">
                <div className="text-center max-w-lg mx-auto py-4">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight font-sans">Upgrade to a Premium Tier</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Select a plan to automatically scale your AI limits, prioritize model executions, and configure custom keys support.</p>
                </div>

                {upgradeSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold leading-relaxed"
                  >
                    {upgradeSuccess}
                  </motion.div>
                )}

                {/* Clean pricing columns card grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* FREE PLAN */}
                  <div className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden ${
                    user.package_type === 'FREE' ? 'border-2 border-slate-700' : 'border-gray-200'
                  }`}>
                    {user.package_type === 'FREE' && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold bg-slate-800 text-white font-mono px-2 py-0.5 rounded uppercase">Active Plan</span>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 font-sans uppercase tracking-wider">Free Starter</h3>
                      <p className="text-2xl font-extrabold text-gray-900 tracking-tight mt-3 font-sans">$0<span className="text-xs text-gray-400 font-normal">/ month</span></p>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Basic sketches with standard assist. Perfect for general layouts.</p>
                      
                      <div className="mt-6 border-t border-gray-100 pt-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>500 Daily Painting Tokens</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Standard 'gemini-3.5-flash' API</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Standard vector multi-layer canvas</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={user.package_type === 'FREE' || upgradingTo !== null}
                      onClick={() => handleUpgrade('FREE')}
                      className={`w-full mt-8 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition-colors text-center ${
                        user.package_type === 'FREE' 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Downgrade to Free
                    </button>
                  </div>

                  {/* PREMIUM PLAN */}
                  <div className={`bg-white border rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden ${
                    user.package_type === 'PREMIUM' ? 'border-2 border-indigo-600' : 'border-indigo-100'
                  }`}>
                    <span className="absolute top-3 right-3 text-[9px] font-bold bg-indigo-650 bg-indigo-600 text-white font-mono px-2 py-0.5 rounded uppercase shadow-xs">Popular Plan</span>
                    <div>
                      <h3 className="text-sm font-bold text-indigo-700 font-sans uppercase tracking-wider">Premium Creator</h3>
                      <p className="text-2xl font-extrabold text-gray-900 tracking-tight mt-3 font-sans">$29<span className="text-xs text-gray-400 font-normal">/ month</span></p>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Extended credits, elevated speeds and prompt templates.</p>
                      
                      <div className="mt-6 border-t border-gray-100 pt-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Check className="w-4 h-4 text-indigo-650 text-indigo-600 shrink-0" />
                          <strong className="text-gray-900">+15,000 Credits Bonus</strong>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Check className="w-4 h-4 text-indigo-650 text-indigo-600 shrink-0" />
                          <span>Advanced Prompt presets list</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Check className="w-4 h-4 text-indigo-650 text-indigo-600 shrink-0" />
                          <span>Standard API + image traces support</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={user.package_type === 'PREMIUM' || upgradingTo !== null}
                      onClick={() => handleUpgrade('PREMIUM')}
                      className={`w-full mt-8 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition-colors text-center ${
                        user.package_type === 'PREMIUM' 
                          ? 'bg-indigo-50 text-indigo-500 cursor-not-allowed border border-indigo-200' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                      }`}
                    >
                      {upgradingTo === 'PREMIUM' ? 'Processing Transaction...' : user.package_type === 'ENTERPRISE' ? 'Downgrade to Premium' : 'Upgrade to Premium'}
                    </button>
                  </div>

                  {/* ENTERPRISE PLAN */}
                  <div className={`bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden ${
                    user.package_type === 'ENTERPRISE' ? 'border-2 border-pink-500' : ''
                  }`}>
                    {user.package_type === 'ENTERPRISE' && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold bg-pink-500 text-white font-mono px-2 py-0.5 rounded uppercase">Active Plan</span>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-indigo-300 font-sans uppercase tracking-wider">Enterprise Elite</h3>
                      <p className="text-2xl font-extrabold text-white mt-3 font-sans">$149<span className="text-xs text-slate-400 font-normal">/ month</span></p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">For production workloads demanding highest grade Gemini Pro intelligence.</p>
                      
                      <div className="mt-6 border-t border-slate-800 pt-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-pink-500 shrink-0" />
                          <strong className="text-white">+100,000 Pro Tokens</strong>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-pink-500 shrink-0" />
                          <span className="font-bold text-indigo-300">Exclusive 'gemini-3.1-pro-preview'</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-pink-500 shrink-0" />
                          <span>Unlimited team active sessions workspace</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={user.package_type === 'ENTERPRISE' || upgradingTo !== null}
                      onClick={() => handleUpgrade('ENTERPRISE')}
                      className={`w-full mt-8 py-2 px-3 text-xs font-bold rounded-lg cursor-pointer transition-colors text-center ${
                        user.package_type === 'ENTERPRISE' 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                          : 'bg-white text-slate-900 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      {upgradingTo === 'ENTERPRISE' ? 'Deploying...' : 'Upgrade to Enterprise'}
                    </button>
                  </div>
                </div>

                {/* Billing details simulation statement */}
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl text-center text-[11px] text-gray-500 leading-relaxed font-sans mt-4">
                  ⚡ All plan transitions instantly update your tokens balance pools, update the backend API routers, and log a <strong className="text-gray-800">SIMULATED</strong> receipt status notification within Administrative mail monitoring screens.
                </div>
              </div>
            )}

            {/* -------------------------------------
                FULL AUDIT LOGS DISPLAY
               ------------------------------------- */}
            {activeTab === 'history' && (
              <div className="space-y-6" id="saas-tab-history-pane">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 tracking-tight font-sans">AI & Actions Usage History</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Comprehensive chronological list of vector assistant calculations and design logs audited.</p>
                  </div>
                  <button 
                    onClick={fetchLogs}
                    className="py-1 px-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-700 transition-all shadow-xs"
                  >
                    Refresh logs
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-4 font-mono text-[9px] font-bold text-gray-400 tracking-wider uppercase">
                    <div className="col-span-2">Calculation Type / API Used</div>
                    <div>Date & Timestamp</div>
                    <div className="text-right">Tokens Cost</div>
                  </div>

                  {loadingLogs ? (
                    <div className="p-16 text-center text-xs text-gray-400 font-mono">Reading audit trail...</div>
                  ) : logs.length === 0 ? (
                    <div className="p-16 text-center text-xs text-gray-400 max-w-sm mx-auto font-sans leading-relaxed">
                      No logs formatted yet. Activate the Creative design workspace to trace transaction operations.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-150 divide-gray-100">
                      {logs.map((log) => (
                        <div key={log.id} className="p-4 grid grid-cols-4 items-center text-xs hover:bg-slate-55 hover:bg-gray-50 transition-colors">
                          <div className="col-span-2 flex items-center space-x-3">
                            <span className="w-5 h-5 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px]/none">
                              ⚙️
                            </span>
                            <div>
                              <p className="font-semibold text-gray-800 font-sans">{log.request_type}</p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{log.api_used}</p>
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">{new Date(log.created_at).toLocaleString()}</div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px]/none select-none border border-red-50">
                              -{log.tokens_consumed}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------
                USER PROFILE SETTINGS TAB
               ------------------------------------- */}
            {activeTab === 'profile' && (
              <div className="space-y-6" id="saas-tab-profile-pane">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5 p-1 border-b border-gray-150">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>My Profile Credentials</span>
                  </h3>

                  {profileMsg && (
                    <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                      {profileMsg}
                    </div>
                  )}
                  {profileErr && (
                    <div className="mb-3 bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                      {profileErr}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-sm mt-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-650 text-gray-500 uppercase tracking-wider mb-1 font-mono">My Registered Email</label>
                      <input 
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-not-allowed outline-none font-sans"
                      />
                      <span className="text-[9px] text-gray-450 text-gray-450 block mt-1 font-sans flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Account authenticated and verified.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-650 text-gray-500 uppercase tracking-wider mb-1 font-mono">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-650 text-gray-500 uppercase tracking-wider mb-1 font-mono">Cell Phone Number</label>
                      <input 
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+1 555-0100"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                    >
                      Save Account Profile Settings
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* -------------------------------------
                ADMINISTRATIVE CONTROL CONSOLE TAB
               ------------------------------------- */}
            {activeTab === 'admin-panel' && user.role === 'admin' && (
              <div className="space-y-6 animate-fade-in" id="saas-tab-admin-pane">
                
                {/* Stats cards strip */}
                {adminStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    {/* Stat 1 */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider block uppercase">Total Registered Users</span>
                        <span className="text-xl font-black text-gray-900 block mt-1 tracking-tight">{adminStats.totalUsers}</span>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider block uppercase">Premium / Pro Tiers</span>
                        <span className="text-xl font-black text-indigo-950 block mt-1 tracking-tight">{adminStats.activeSubs}</span>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 fill-pink-500/10" />
                      </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider block uppercase">Total API Runs Consumed</span>
                        <span className="text-xl font-black text-gray-900 block mt-1 tracking-tight">{adminStats.totalTokensUsed.toLocaleString()}</span>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stat 4 */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 font-mono tracking-wider block uppercase">Mails Intercepted Logs</span>
                        <span className="text-xl font-black text-gray-900 block mt-1 tracking-tight">{adminStats.smtpCount}</span>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-605 text-violet-600 flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                    </div>

                  </div>
                )}

                {/* Submitting Feedback Success msg */}
                {adminMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed">
                    {adminMessage}
                  </div>
                )}

                {/* Dynamic Edit User Modal overlay */}
                {editingUserId && (
                  <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 shadow-xs relative">
                    <button 
                      onClick={() => setEditingUserId(null)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                    <h3 className="text-sm font-bold text-indigo-900 font-sans mb-4">🔧 Edit User Profile Slot Configuration ({editingUserId})</h3>
                    
                    <form onSubmit={handleSaveUserByAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">User Display Name</label>
                        <input 
                          type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-250 border-gray-250 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Phone contact</label>
                        <input 
                          type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Authorization Role</label>
                        <select value={editRole} onChange={(e: any) => setEditRole(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                        >
                          <option value="user">Standard User</option>
                          <option value="admin">System Administrator</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Subscription Package</label>
                        <select value={editPackage} onChange={(e: any) => setEditPackage(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                        >
                          <option value="FREE">FREE STARTER Tier</option>
                          <option value="PREMIUM">PREMIUM CREATOR Tier</option>
                          <option value="ENTERPRISE">ENTERPRISE ELITE Tier</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Credits Tokens Pool</label>
                        <input 
                          type="number" required value={editTokens} onChange={(e) => setEditTokens(parseInt(e.target.value, 10))}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Access Status</label>
                        <select value={editStatus} onChange={(e: any) => setEditStatus(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs"
                        >
                          <option value="ACTIVE">ACTIVE STATUS</option>
                          <option value="SUSPENDED">SUSPENDED (BLOCK ACCESS)</option>
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-3 flex items-center gap-2 pt-2">
                        <button type="submit" className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-sans text-xs font-bold">
                          Save Changes
                        </button>
                        <button type="button" onClick={() => setEditingUserId(null)} className="py-1.5 px-3 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 text-xs">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Users List block */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 font-sans">Active User Records Registry</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">Manage permission roles, recharge design credit values, and toggle platform access.</p>
                    </div>

                    {/* Integrated search filter */}
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search users by name, email, plan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none rounded-lg text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                          <th className="p-4 pl-6">Profile Identifier</th>
                          <th className="p-4">Authorization</th>
                          <th className="p-4">Tiers Billing</th>
                          <th className="p-4">Tokens Remaining</th>
                          <th className="p-4">Access Status</th>
                          <th className="p-4 text-right pr-6">Administrative Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="text-xs hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6">
                              <p className="font-bold text-gray-800">{u.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{u.email}</p>
                              {u.phone && <p className="text-[9px] text-gray-400 font-mono mt-0.5">{u.phone}</p>}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                u.role === 'admin' ? 'bg-amber-150 bg-amber-100 text-amber-900 border border-amber-200' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                u.package_type === 'ENTERPRISE' ? 'bg-pink-100 text-pink-700 font-black' : u.package_type === 'PREMIUM' ? 'bg-indigo-100 text-indigo-750 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.package_type}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-gray-700">{u.tokens_remaining.toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                                u.account_status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.account_status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                {u.account_status}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6 space-x-1.5">
                              <button 
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1 px-2 border border-gray-200 hover:border-indigo-300 text-gray-500 hover:text-indigo-650 hover:text-indigo-600 hover:bg-indigo-50 rounded text-[10px] font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                                id={`admin-edit-btn-${u.id}`}
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                              <button 
                                disabled={u.id === user.id}
                                onClick={() => handleDeleteUserByAdmin(u.id)}
                                className={`p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded border border-transparent hover:border-red-100 cursor-pointer transition-all inline-flex items-center justify-center ${
                                  u.id === user.id ? 'opacity-30 cursor-not-allowed' : ''
                                }`}
                                id={`admin-delete-btn-${u.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-pane: Email Logs Monitor */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden mt-6">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 font-sans">📧 SMTP Mail Transactions Log</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">Real-time telemetry of account verification codes, receipts and newsletters sent.</p>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-gray-400 uppercase">SANDBOX INTERCEPTOR ACTIVE</span>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto font-sans">
                    {adminStats && adminStats.mailLogs && adminStats.mailLogs.length > 0 ? (
                      adminStats.mailLogs.map((log: any, idx: number) => (
                        <div key={log.id || idx} className="p-4 px-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="text-base">✉️</span>
                            <div>
                              <p className="font-semibold text-gray-800">{log.email}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{log.type} • {new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[9px]/tight font-bold font-mono border ${
                              log.smtp_status === 'SUCCESS' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : log.smtp_status === 'SIMULATED'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                              {log.smtp_status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center text-xs text-gray-400">No active mail logs available in sandbox yet.</div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
