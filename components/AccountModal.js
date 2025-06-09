import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/AccountModal.module.css';
import Button from './Button';
import { useRouter } from 'next/router';
import { TokenManager, clearTokensInSystem } from '../utils/tokenManager';
import { handleFetchError } from '../utils/fetchErrorHandler';
import { ApiClient } from "../utils/ApiClient";
const apiClient = new ApiClient();

export default function AccountModal({ isOpen, onClose }) {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        sessions: []
    });
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();
    const addNotification = (message) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 3000);
    };

    useEffect(() => {
        if (isOpen) {
            const fetchUserData = async () => {
                let attempts = 0;
                const maxAttempts = 2;
                while (attempts < maxAttempts) {
                  const response = await apiClient.getAccount();
                  if (response.type === 'ErrorSystem') {
                    addNotification(response.body);
                    return null;
                  }
                  if (response.type === 'ErrorToken') {
                    attempts++;
                    const result = await TokenManager.refreshTokens();
                    if (result === 'err'){
                      addNotification(response.body);
                      setTimeout(router.replace, 3000, '/login');
                      return null;
                    }
                    if (attempts === maxAttempts) {
                      addNotification(response.body);
                      setTimeout(router.replace, 3000, '/login');
                      return null;
                    }
                    continue;
                  }
        
                    const data = await response.body;
                    setUserData(data);
                    return;
                }
            };

            fetchUserData();
        }
    }, [isOpen, router]);

    const handleLogout = async () => {
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          const response = await apiClient.logout();
          if (response.type === 'ErrorSystem') {
            addNotification(response.body);
            return null;
          }
          if (response.type === 'ErrorToken') {
            attempts++;
            const result = await TokenManager.refreshTokens();
            if (result === 'err'){
                addNotification(response.body);
              setTimeout(router.replace, 3000, '/login');
              return null;
            }
            if (attempts === maxAttempts) {
                addNotification(response.body);
              setTimeout(router.replace, 3000, '/login');
              return null;
            }
            continue;
          }
            TokenManager.clear();
            router.push('/login');
            onClose();
            return;
        }

    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation();
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          const response = await apiClient.deleteSession(sessionId);
          if (response.type === 'ErrorSystem') {
            addNotification(response.body);
            return null;
          }
          if (response.type === 'ErrorToken') {
            attempts++;
            const result = await TokenManager.refreshTokens();
            if (result === 'err'){
              addNotification(response.body);
              setTimeout(router.replace, 3000, '/login');
              return null;
            }
            if (attempts === maxAttempts) {
              addNotification(response.body);
              setTimeout(router.replace, 3000, '/login');
              return null;
            }
            continue;
          }
          if(response.type === 'Error'){
            addNotification("Ты не можешь удалить ссессию в которой ты находишься");
            return null;
          }
            setUserData(prev => ({
                ...prev,
                sessions: prev.sessions.filter(session => session.id !== sessionId)
            }));
            return
        }
    };

    const formatDate = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} минут назад`;
        if (diffHours < 24) return `${diffHours} часов назад`;
        if (diffDays < 7) return `${diffDays} дней назад`;

        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                 <div className={styles.notificationList}>
                <AnimatePresence mode="popLayout">
                    {notifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            className={styles.notification}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            {notif.message}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
                    <div className={styles.overlay} onClick={onClose} />
                    <motion.div
                        className={styles.modal}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className={styles.content}>
                            <div className={styles.userInfo}>
                                <h1 className={styles.userName}>{userData.name}</h1>
                                <p className={styles.userEmail}>{userData.email}</p>
                            </div>
                            
                            <div className={styles.sessionsContainer}>
                                <h2>Активные сессии</h2>
                                <div className={styles.sessionsList}>
                                    {userData.sessions.map(session => {
                                        const handleDelete = (e) => handleDeleteSession(session.id, e);
                                        
                                        return (
                                            <motion.div 
                                                key={session.id} 
                                                className={styles.sessionItem}
                                                whileHover={{ 
                                                    scale: 1.02,
                                                    transition: { type: "spring", stiffness: 400, damping: 25 }
                                                }}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                            >
                                                <div className={styles.sessionInfo}>
                                                    <div className={styles.sessionDetails}>
                                                        <p className={styles.deviceInfo}>
                                                            {session.browser || 'Неизвестный браузер'}
                                                        </p>
                                                        <span className={styles.lastActionTime}>
                                                            {formatDate(session.lastActivity)}
                                                        </span>
                                                    </div>
                                                    <motion.button
                                                        className={styles.deleteButton}
                                                        onClick={handleDelete}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="24" height="24">
                                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Button onClick={handleLogout} className={styles.logoutButton}>
                                Выйти из аккаунта
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}