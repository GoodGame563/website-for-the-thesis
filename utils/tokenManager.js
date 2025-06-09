'use client';
import { handleFetchError } from './fetchErrorHandler';
import { ApiClient } from './ApiClient';

const apiClient = new ApiClient();
function clearTokensInSystem() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('accessTokenLifetime');
    localStorage.removeItem('refreshTokenLifetime');
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  }

export class TokenManager {
  static setTokens(data) {
    localStorage.setItem('accessToken', data.accessToken.token);
    localStorage.setItem('accessTokenLifetime', data.accessToken.lifeTime[0].toString());
    localStorage.setItem('refreshTokenLifetime', data.refreshTokenLifeTime[0].toString());
    localStorage.setItem('tokenTimestamp', Date.now().toString());
    
  }
  static clear(){
    clearTokensInSystem();
  }

  static isAccessTokenExpired() {
    const timestamp = Number(localStorage.getItem('tokenTimestamp'));
    const lifetime = Number(localStorage.getItem('accessTokenLifetime')) * 1000;
    return Date.now() - timestamp > lifetime;
  }

  static hasValidTokens() {
    const accessToken = localStorage.getItem('accessToken');
    return !!(accessToken);
  }


  static async refreshTokens() {
    const data = await apiClient.refreshTokens();
    if (!(data.type === 'Ok')) {
      if (data.type === 'ErrorToken'){
        clearTokensInSystem();
        return 'err'; 
      }      
      return 'wait';  
    }
    this.setTokens(data.body);
    console.log('Tokens successfully refreshed');
    return 'ok';
  }

  static async getValidAccessToken() {
    if (this.hasValidTokens() && !this.isAccessTokenExpired()) {
      const access = localStorage.getItem('accessToken');
      if (access != null)
      return{ 
        result: access,
        type: 'Ok'
      }
    }
    if (!this.hasValidTokens()){
      return{
        type: 'Error',
        result: ''
      }
    }
    const success = await this.refreshTokens();
    if (!(success === 'ok')) {
      clearTokensInSystem()
      console.log(success)
      return {
        result: success === 'err' ? 'Сессия больше не действительна' : 'Ожидайте пропало подключение к серверу',
        type: success === 'err' ? 'Error' : 'ErrorSystem'
      }
    }

    if (this.hasValidTokens() && !this.isAccessTokenExpired()) {
      const access = localStorage.getItem('accessToken');
      if (access != null)
      return{ 
        result: access,
        type: 'Ok'
      }
    }
    return{
      result: "Idk",
      type: 'ErrorRofl'
    }
  }
}