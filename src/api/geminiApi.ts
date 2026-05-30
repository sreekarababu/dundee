import { getAuthHeader } from '../lib/authSupport';

const API_BASE = '/api';

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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
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
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
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
  }
};
export default geminiApi;
