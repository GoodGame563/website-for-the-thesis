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
    localStorage.setItem('refreshToken', data.refreshToken.token);
    localStorage.setItem('accessTokenLifetime', data.accessToken.lifeTime[0].toString());
    localStorage.setItem('refreshTokenLifetime', data.refreshToken.lifeTime[0].toString());
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
    const refreshToken = localStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken);
  }

  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('accessTokenLifetime');
    localStorage.removeItem('refreshTokenLifetime');
  }

  static async refreshTokens() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token available');
        return false;
      }

      const response = await fetch('http://localhost:8000/api/v1/tokens/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
          browser: navigator.userAgent,
          device: navigator.platform,
          os: navigator.oscpu || 'Unknown OS',
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed with status ${response.status}`);
      }

      const data = await response.json();
      this.setTokens(data);
      console.log('Tokens successfully refreshed');
      return true;
    } catch (error) {
      console.error('Error refreshing tokens:', handleFetchError(error));
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