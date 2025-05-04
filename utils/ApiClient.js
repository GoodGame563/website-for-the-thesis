import { TokenManager } from './tokenManager';
import { handleFetchError } from './fetchErrorHandler';

export class ApiClient {
  constructor(baseUrl = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = await TokenManager.getValidAccessToken();
      if (!token) {
        throw new Error('No valid token available');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      credentials: 'include', 
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response; 
      
    } catch (error) {
      const retryResult = await handleFetchError(error, () => this.request(endpoint, method, body, requiresAuth));
      if (typeof retryResult === 'string' && retryResult.includes('Сессия недействительна')) {
        throw new Error(retryResult);
      }
      throw error;
    }
  }

  async login(email, password) {
    const body = {
      email,
      password,
      browser: navigator.userAgent,
      device: navigator.platform,
      os: navigator.oscpu || 'Unknown OS',
    };
    return this.request('/authorization', 'POST', body, false);
  }

  async refreshTokens() {
    const body = {
      browser: navigator.userAgent,
      device: navigator.platform,
      os: navigator.oscpu || 'Unknown OS',
    };
    return this.request('/refresh', 'POST', body, false);
  }

  async logout() {
    return this.request('/exit', 'POST');
  }

  async deleteSession(sessionId) {
    return this.request('/delete/session', 'DELETE', { id: sessionId });
  }

  async getAccount() {
    return this.request('/get/account');
  }

  async getHistory() {
    return this.request('/get/history');
  }

  async getTask(taskId) {
    return this.request('/get/task', 'POST', { id: taskId });
  }

  async getWords(productId) {
    return this.request(`/get/words/${encodeURIComponent(productId)}`, 'GET');
  }

  async createTask(main, products, usedWords, unusedWords) {
    const body = {
      main,
      products,
      used_words: usedWords,
      unused_words: unusedWords,
    };
    return this.request('/create/task', 'POST', body);
  }

  async editTask(taskId, newName) {
    return this.request('/edit/task', 'PUT', { id: taskId, newName });
  }

  async regenerateTask(taskId, main, products, usedWords, unusedWords) {
    const body = {
      id: taskId,
      main,
      products,
      used_words: usedWords,
      unused_words: unusedWords,
    };
    return this.request('/regenerate/task', 'POST', body);
  }
}