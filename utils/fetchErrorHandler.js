import { TokenManager } from './tokenManager';

export const handleFetchError = async (error, retryCallback = null) => {
  // Handle 401 Unauthorized errors or missing access token
  if (error.status === 401 || error.message?.includes('401') || !TokenManager.hasValidTokens()) {
    try {
      // Attempt to refresh tokens
      const refreshSuccess = await TokenManager.refreshTokens();
      
      // // If refresh was successful and we have a retry callback, retry the original request
      // if (refreshSuccess && retryCallback) {
      //   return await retryCallback();
      // }
      
      // // If refresh failed, clear tokens and redirect
      // if (!refreshSuccess) {
      //   TokenManager.clearTokens();
      //   if (typeof window !== 'undefined') {
      //     localStorage.setItem('loginError', 'Ваша сессия недействительна');
      //     window.location.href = '/login';
      //   }
      //   return 'Сессия недействительна. Выполняется перенаправление на страницу входа...';
      // }
      
      // return 'Токены обновлены, но повторный запрос не выполнен';
    } catch (refreshError) {
      // If refresh fails, clear tokens and redirect
      // TokenManager.clearTokens();
      // if (typeof window !== 'undefined') {
      //   localStorage.setItem('loginError', 'Ваша сессия недействительна');
      //   window.location.href = '/login';
      // }
      return 'Сессия недействительна. Выполняется перенаправление на страницу входа...';
    }
  }

  if (error.message === 'Failed to fetch') {
    return 'Сервер сейчас не доступен. Пожалуйста, проверьте своё интернет-соединение.';
  }
  return error.message;
};