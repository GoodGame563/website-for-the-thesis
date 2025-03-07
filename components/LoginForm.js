import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/LoginForm.module.css';
import Button from './Button';

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const passwordRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const typeText = (text, setter) => {
    let i = 0;
    setter('');
    const interval = setInterval(() => {
      if (i < text.length) {
        setter((prev) => prev + text[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
  };

  const validateInput = (value, regex, errorSetter, errorMessage) => {
    if (!regex.test(value)) {
      typeText(errorMessage, errorSetter);
      return false;
    }
    errorSetter('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateInput(
      email,
      emailRegex,
      setEmailError,
      '  Пожалуйста, введите корректный email.  '
    );
    const isPasswordValid = true;

    if (!isEmailValid || !isPasswordValid) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          browser: navigator.userAgent,
          device: navigator.platform,
          os: navigator.oscpu || 'Unknown OS',
        }),
      });

      if (!response.ok) throw new Error('Ошибка авторизации');

      const data = await response.json();
      localStorage.setItem('accessToken', data.Ok.accessToken.token);
      localStorage.setItem('refreshToken', data.Ok.refreshToken.token);
      onLoginSuccess();
    } catch (error) {
      typeText(error.message || 'Ошибка входа', setEmailError);
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
      <Button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? <div className={styles.loading}></div> : 'Войти'}
      </Button>
    </div>
  );
}