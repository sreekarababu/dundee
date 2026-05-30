import { getAuthHeader } from '../lib/authSupport';

const API_BASE = '/api';

const getApiHeaders = () => {
  const headers: any = {
    'Content-Type': 'application/json',
    ...getAuthHeader()
  };
  const customKey = localStorage.getItem('dundee_custom_gemini_key');
  if (customKey) {
    headers['x-custom-gemini-key'] = customKey;
  }
  return headers;
};

export const geminiApi = {
  generateText: async (payload: {
    contents: any;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
    tools?: any[];
  }) => {
    const res = await fetch(`${API_BASE}/gemini/generate-text`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gemini text service failed');
    }
    return data;
  },

  generateImage: async (payload: {
    contents: any;
    aspectRatio?: string;
  }) => {
    const res = await fetch(`${API_BASE}/gemini/generate-image`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gemini image service failed');
    }
    // Map response fields directly into the .image property required by UI components
    if (data.base64Data && data.mimeType) {
      data.image = `data:${data.mimeType};base64,${data.base64Data}`;
    }
    return data;
  },

  generateVideo: async (payload: {
    prompt: string;
    startImageBase64?: string;
    endImageBase64?: string;
    duration?: string;
    aspectRatio?: string;
  }) => {
    const res = await fetch(`${API_BASE}/gemini/generate-video`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gemini video service failed');
    }
    return data;
  },

  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health/gemini`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        status: 'unhealthy',
        reason: 'http_error',
        message: errData.error || `HTTP error ${res.status}`
      };
    }
    const data = await res.json();
    return data as { status: 'healthy' | 'unhealthy'; reason?: string; message: string };
  },

  saveCloudData: async (data: any) => {
    const res = await fetch(`${API_BASE}/cloud/save`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ data })
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to save to cloud storage');
    }
    return result;
  },

  loadCloudData: async () => {
    const res = await fetch(`${API_BASE}/cloud/load`, {
      method: 'GET',
      headers: getApiHeaders()
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to load from cloud storage');
    }
    return result;
  }
};
export default geminiApi;
