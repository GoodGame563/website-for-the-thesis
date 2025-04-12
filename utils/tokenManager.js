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

  static async refreshTokens() {
    console.log('Token refresh attempted');
    return false;
  }

  static async getValidAccessToken() {
    if (!this.isAccessTokenExpired()) {
      return this.getAccessToken();
    }

    const success = await this.refreshTokens();
    if (!success) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenTimestamp');
      localStorage.removeItem('accessTokenLifetime');
      localStorage.removeItem('refreshTokenLifetime');
      return null;
    }

    return this.getAccessToken();
  }
}