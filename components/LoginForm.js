import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/LoginForm.module.css';
import Button from './Button';
import { TokenManager } from '../utils/tokenManager';
import { handleFetchError } from '../utils/fetchErrorHandler';

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;


  const errorMessages = {
    'failed to fetch': 'Ошибка подключения к серверу. Пожалуйста, проверьте своё подключение к интернету.',
    'network error': 'Ошибка сети. Пожалуйста, проверьте подключение к интернету.',
    'authentication failed': 'Ошибка аутентификации. Проверьте правильность введенных данных.',
    'invalid credentials': 'Неверные учетные данные. Проверьте email и пароль.',
    'user not found': 'Пользователь не найден.',
    'invalid email format': 'Неверный формат email адреса.',
    'invalid password': 'Неверный пароль.',
    'server error': 'Ошибка сервера. Попробуйте позже.',
    'ошибка авторизации': 'Ошибка авторизации. Проверьте правильность введенных данных.',
    'пожалуйста, введите корректный email':'Пожалуйста, введите корректный email'
  };

  const formatErrorMessage = (error) => {
    if (!error) return 'Произошла неизвестная ошибка';
    
    if (typeof error === 'string') {
      const errorKey = error.toLowerCase();
      return errorMessages[errorKey] || error;
    }
    
    if (error.message) { 
      const errorKey = error.message.toLowerCase();
      return errorMessages[errorKey] || error.message;
    }

    return 'Произошла неизвестная ошибка';
  };

  const showError = (error, setter) => {
    const formattedError = formatErrorMessage(error);
    setter(formattedError);
  };

  const validateInput = (value, regex, errorSetter, errorMessage) => {
    if (!value.trim()) {
      showError(errorMessage.toLowerCase(), errorSetter);
      return false;
    }
    if (!regex.test(value)) {
      showError(errorMessage.toLowerCase(), errorSetter);
      return false;
    }
    errorSetter('');
    return true;
  };

  const handleLogin = async () => {
    // Очищаем предыдущие ошибки
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateInput(
      email,
      emailRegex,
      setEmailError,
      'Пожалуйста, введите корректный email'
    );

    if (!password.trim()) {
      showError('Пожалуйста, введите пароль', setPasswordError);
      return;
    }

    if (!isEmailValid) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          browser: navigator.userAgent,
          device: navigator.platform,
          os: navigator.oscpu || 'Unknown OS',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'ошибка авторизации');
      }

      const data = await response.json();
      TokenManager.setTokens(data);
      onLoginSuccess();
    } catch (error) {
      const errorMessage = handleFetchError(error);
      showError(errorMessage.toLowerCase(), setEmailError);
    } finally {
      setIsLoading(false);
    }
  };

  const inputShake = {
    shake: {
      x: [0, -5, 5, -5, 0],
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  };

  return (
    <div className={styles.container}>
      <h1>Вход</h1>
      <motion.input
        ref={emailInputRef}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`${styles.input} ${emailError ? styles.error : ''}`}
        variants={inputShake}
        animate={emailError ? 'shake' : undefined}
      />
      <motion.div
        className={styles.errorMessage}
        variants={errorVariants}
        initial="hidden"
        animate={emailError ? 'visible' : 'hidden'}
      >
        {emailError}
      </motion.div>
      <motion.input
        ref={passwordInputRef}
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${styles.input} ${passwordError ? styles.error : ''}`}
        variants={inputShake}
        animate={passwordError ? 'shake' : undefined}
      />
      <motion.div
        className={styles.errorMessage}
        variants={errorVariants}
        initial="hidden"
        animate={passwordError ? 'visible' : 'hidden'}
      >
        {passwordError}
      </motion.div>
      <Button onClick={handleLogin} disabled={isLoading} isLoading={isLoading}>
        {isLoading ? <div className={styles.loading}></div> : 'Войти'}
      </Button>
    </div>
  );
}