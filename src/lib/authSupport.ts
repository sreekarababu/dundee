import { UserSession, ApiLog, SmtpLog } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  const token = localStorage.getItem('canvas_saas_token');
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
}

export function setAuthToken(token: string) {
  localStorage.setItem('canvas_saas_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('canvas_saas_token');
}

export function getAuthHeader() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const saasApi = {
  // Authentication REST Operations
  sendOtp: async (email: string, type: 'signup' | 'forgot') => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed sending OTP verification');
    return data;
  },

  signup: async (payload: any) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed registering account');
    return data;
  },

  login: async (payload: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Credentials incorrect');
    return data;
  },

  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Forgot password failed');
    return data;
  },

  resetPassword: async (payload: any) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset password failed');
    return data;
  },

  getMe: async (): Promise<UserSession> => {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) {
      removeAuthToken();
      throw new Error(data.error || 'Failed to authenticate active session');
    }
    return data.user;
  },

  // Token & Subscription Actions
  deductTokens: async (tokensConsumed: number, actionType: string) => {
    const res = await fetch(`${API_BASE}/tokens/deduct`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ tokensConsumed, actionType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed token deduction action');
    return data;
  },

  upgradePlan: async (tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
    const res = await fetch(`${API_BASE}/subscriptions/upgrade`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ tier })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Subscription upgrade transaction halted');
    return data;
  },

  getUsageHistory: async (): Promise<ApiLog[]> => {
    const res = await fetch(`${API_BASE}/usage/history`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed retrieve usage log info');
    return data.logs;
  },

  // AI Copilot Service Call
  askAiCopilot: async (prompt: string, canvasContext?: any, linesCount?: number) => {
    const res = await fetch(`${API_BASE}/ai/copilot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ prompt, canvasContext, linesCount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI Copilot communication failed');
    return data;
  },

  // Admin Controls
  adminGetUsers: async (): Promise<UserSession[]> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Administrative fetch permission failure');
    return data.users;
  },

  adminUpdateUser: async (userId: string, payload: Partial<UserSession>) => {
    const res = await fetch(`${API_BASE}/admin/user/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Administrative single update failure');
    return data;
  },

  adminDeleteUser: async (userId: string) => {
    const res = await fetch(`${API_BASE}/admin/user/${userId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Administrative delete failure');
    return data;
  },

  adminGetStats: async () => {
    const res = await fetch(`${API_BASE}/admin/system-stats`, {
      headers: { ...getAuthHeader() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Administrative total calculations fetch failure');
    return data;
  }
};
