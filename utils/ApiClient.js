import { TokenManager } from './tokenManager';

async function getClientInfo() {
  let info = {
    browser: 'Unknown Browser',
    device: 'Unknown Device',
    os: 'Unknown OS',
    screenResolution: `${screen.width} x ${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  if (navigator.userAgentData) {
    const brands = navigator.userAgentData.brands;
    info.browser = brands.map(brand => `${brand.brand} ${brand.version}`).join(', ');
    const ua = await navigator.userAgentData.getHighEntropyValues(["platform", "platformVersion"]);
    info.device = ua.platform || 'Unknown Device';
    info.os = `${ua.platform} ${ua.platformVersion || ''}`.trim();
  } else {
    const ua = navigator.userAgent;
    if (ua.indexOf("Win") != -1) info.os = "Windows";
    else if (ua.indexOf("Mac") != -1) info.os = "MacOS";
    else if (ua.indexOf("Linux") != -1) info.os = "Linux";
    else if (ua.indexOf("Android") != -1) info.os = "Android";
    else if (ua.indexOf("like Mac OS X") != -1) info.os = "iOS";
    
    info.device = navigator.platform || 'Unknown Device';
    info.browser = ua; 
  }

  if (navigator.hardwareConcurrency) {
    info.hardwareConcurrency = navigator.hardwareConcurrency;
  }
  if (navigator.deviceMemory) {
    info.deviceMemory = navigator.deviceMemory;
  }

  return info;
}

export class ApiClient {
  constructor(baseUrl = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, method = 'GET', body = null, requiresAuth = true, requiresEncoding = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    };

    if (requiresAuth) {
      const tokenData = await TokenManager.getValidAccessToken();
      switch (tokenData.type) {
        case 'Error':
          return {
            type: 'Error',
            body: tokenData.result,
            bodyType: 'message'
          };
        case 'ErrorSystem':
          return {
            type: 'ErrorSystem',
            body: tokenData.result,
            bodyType: 'message'
          };
      }
      const token = tokenData.result;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      credentials: 'include', 
    };

    if (body) {
      options.body = JSON.stringify(body);
      if (requiresEncoding) {
        headers['Content-Encoding'] = 'gzip';
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      
      const contentType = response.headers.get('content-type');
      let responseBody = contentType && contentType.includes('application/json') 
        ? await response.json() 
        : await response.text();
      switch (response.status) {
        case 200:
        case 201:
        case 202:
          return {
            type: 'Ok',
            body: responseBody,
            bodyType: contentType && contentType.includes('application/json') ? 'struct' : 'message'
          };
        case 400:
          return {
            type: 'Error',
            body: 'Bad request: Invalid request parameters',
            bodyType: 'message'
          };
        case 401: 
          return {
            type: 'ErrorToken',
            body: 'Ваша сессия больше не действительна.',
            bodyType: 'message'
          };
        case 402:
          return {
            type: 'Error',
            body: 'Оплатите для использования сервиса',
            bodyType: 'message'
          };
        case 404:
          return {
            type: 'Error',
            body: 'Not found: Resource does not exist',
            bodyType: 'message'
          };
        case 409:
          return {
            type: 'Error',
            body: 'Такой email уже зарегистрирован',
            bodyType: 'message'
          };
        case 413:
          return {
            type: 'Error',
            body: 'Пожалуйста сообщите об данной ошибке администраторам и попробуйте другой товар',
            bodyType: 'message'
          };
        case 422:
          return {
            type: 'Error',
            body: 'Unprocessable entity: Invalid data format',
            bodyType: 'message'
          };
        case 500:
          return {
            type: 'ErrorSystem',
            body: 'Ошибка сервера, пожалуйста повторите свой запрос через 5 секунд.',
            bodyType: 'message'
          };
        default:
          return {
            type: 'Error',
            body: `Request failed with status ${response.status}`,
            bodyType: 'message'
          };
      }
      
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        return {
          type: 'ErrorSystem',
          body: 'Ошибка подключения к серверу. Пожалуйста, проверьте своё подключение к интернету.',
          bodyType: 'message'
        };
      }
      return {
        type: 'ErrorSystem',
        body: error.message,
        bodyType: 'message'
      };
    }
  }
  async streamTaskInformation(taskId, onMessageCallback) {
    try {
      const headers = {
        'Accept': 'text/plain',
      };
      const tokenData = await TokenManager.getValidAccessToken();
      if (tokenData.type === 'Error' || tokenData.type === 'ErrorSystem') {
        return {
          type: tokenData.type,
          body: tokenData.result,
          bodyType: 'message'
        };
      }
      headers['Authorization'] = `Bearer ${tokenData.result}`;

      const controller = new AbortController();
      const response = await fetch(`${this.baseUrl}/information?id=${taskId}`, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          type: 'Error',
          body: `HTTP error! status: ${response.status}`,
          bodyType: 'message'
        };
      }

      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onMessageCallback({
            type: 'Ok',
            body: 'Stream completed',
            bodyType: 'message'
          });
          break;
        }

        buffer += new TextDecoder().decode(value);
        const messagesArray = buffer.split('\n\n');
        buffer = messagesArray.pop();

        for (const message of messagesArray) {
          if (message.trim()) {
            try {
              const data = JSON.parse(message);
              if (data.error) {
                await onMessageCallback({
                  type: 'Error',
                  body: data.error,
                  bodyType: 'message'
                });
                controller.abort();
                return {
                  type: 'Error',
                  body: data.error,
                  bodyType: 'message'
                };
              }

              let messageType = 'Ok';
              if (data.task_type === 'system' && data.message === 'done') {
                messageType = 'Done';
                controller.abort();
              }

              await onMessageCallback({
                type: messageType,
                body: {
                  task_type: data.task_type,
                  message: data.message
                },
                bodyType: 'struct'
              });
            } catch (error) {
              await onMessageCallback({
                type: 'Error',
                body: `Failed to parse message: ${error.message}`,
                bodyType: 'message'
              });
            }
          }
        }
      }

      return {
        type: 'Ok',
        body: 'Stream processing completed',
        bodyType: 'message',
        abortController: controller
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          type: 'Error',
          body: 'Stream aborted',
          bodyType: 'message'
        };
      }
      return {
        type: 'ErrorSystem',
        body: `Error in stream: ${error.message}`,
        bodyType: 'message'
      };
    }
  }

  async login(email, password) {
    const clientInfo = await getClientInfo();
    const body = {
      email,
      password,
      browser: clientInfo.browser,
      device: clientInfo.device,
      os: clientInfo.os,
    };
    return this.request('/auth/authorization', 'POST', body, false);
  }

  async register(name, email, password) {
    const body = {
      email:email,
      password:password,
      name:name
    };
    return this.request('/auth/registration', 'POST', body, false);
  }

  async refreshTokens() {
    const clientInfo = await getClientInfo();
    const body = {
      browser: clientInfo.browser,
      device: clientInfo.device,
      os: clientInfo.os,
    };
    return this.request('/auth/refresh', 'POST', body, false);
  }

  async logout() {
    return this.request('/auth/exit', 'POST');
  }
  async check(){
    return this.request('/auth/check', 'GET');
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
    return this.request('/create/task', 'POST', body, true, true);
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
    return this.request('/regenerate/task', 'POST', body, true, true);
  }

  async postTask(taskid, taskType, message) {
    const body = {
      id: taskid,
      taskType: taskType,
      message: message
    }
    return this.request('/add/task', 'POST', body, true);
  }
  async deleteTask(taskId){
    const body = {
      id: taskId
    }
    return this.request('/delete/task', 'POST', body, true);
  }
}