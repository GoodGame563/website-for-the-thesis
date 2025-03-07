import { useRef } from 'react';
import styles from '../styles/Button.module.css';

export default function Button({ children, onClick, disabled, className, isLoading }) {
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = styles.waveEffect;
    wave.style.left = `${e.clientX - rect.left}px`;
    wave.style.top = `${e.clientY - rect.top}px`;
    buttonRef.current.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
    onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      className={`${styles.btn} ${className || ''} ${disabled ? styles.disabled : ''} ${isLoading ? styles.loading : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}