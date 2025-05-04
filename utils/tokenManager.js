'use client';
import { handleFetchError } from './fetchErrorHandler';

export class TokenManager {
  static getTokenTimestamp() {
    return localStorage.getItem('tokenTimestamp');
  }

  static setTokenTimestamp() {
    localStorage.setItem('tokenTimestamp', Date.now().toString());
  }

  static setTokens(data) {
    localStorage.setItem('accessToken', data.accessToken.token);
    localStorage.setItem('accessTokenLifetime', data.accessToken.lifeTime[0].toString());
    localStorage.setItem('refreshTokenLifetime', data.refreshTokenLifeTime[0].toString());
    this.setTokenTimestamp();
  }

  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static isAccessTokenExpired() {
    const timestamp = Number(this.getTokenTimestamp());
    const lifetime = Number(localStorage.getItem('accessTokenLifetime')) * 1000;
    return Date.now() - timestamp > lifetime;
  }

  static hasValidTokens() {
    const accessToken = localStorage.getItem('accessToken');
    return !!(accessToken);
  }

  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('accessTokenLifetime');
    localStorage.removeItem('refreshTokenLifetime');
  }

  static async refreshTokens() {
    try {
      const makeRefreshRequest = async () => {
        const response = await fetch('http://localhost:8000/api/v1/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
          body: JSON.stringify({
            browser: navigator.userAgent,
            device: navigator.platform,
            os: navigator.oscpu || 'Unknown OS',
          })
        });
        console.log(response);

        if (response.status === 401) {
          this.clearTokens();
          if (typeof window !== 'undefined') {
            localStorage.setItem('loginError', 'Ваша сессия недействительна');
            // window.location.href = '/login';
          }
          return false;
        }

        if (!response.ok) {
          const error = new Error(`Token refresh failed with status ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data = await response.json();
        return data;
      };

      const data = await makeRefreshRequest();
      if (!data) return false;

      this.setTokens(data);
      console.log('Tokens successfully refreshed');
      return true;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      await handleFetchError(error);
      return false;
    }
  }

  static async getValidAccessToken() {
    if (!this.hasValidTokens()) {
      return null;
    }

    if (!this.isAccessTokenExpired()) {
      return this.getAccessToken();
    }

    const success = await this.refreshTokens();
    if (!success) {
      this.clearTokens();
      return null;
    }

    return this.getAccessToken();
  }
}