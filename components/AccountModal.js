import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/AccountModal.module.css';
import Button from './Button';
import { useRouter } from 'next/router';
import { TokenManager } from '../utils/tokenManager';

export default function AccountModal({ isOpen, onClose }) {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        sessions: []
    });
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            const fetchUserData = async () => {
                try {
                    const token = await TokenManager.getValidAccessToken();
                    if (!token) {
                        TokenManager.clearTokens();
                        router.push('/login');
                        return;
                    }

                    const response = await fetch('http://localhost:8000/api/v1/get/account', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch account data: ${response.status}`);
                    }

                    const data = await response.json();
                    setUserData(data);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            };

            fetchUserData();
        }
    }, [isOpen, router]);

    const handleLogout = () => {
        TokenManager.clearTokens();
        router.push('/login');
        onClose();
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation();
        try {
            const token = await TokenManager.getValidAccessToken();
            if (!token) {
                TokenManager.clearTokens();
                router.push('/login');
                return;
            }

            const response = await fetch(`http://localhost:8000/api/v1/delete/session`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: sessionId })
            });

            if (!response.ok) {
                throw new Error(`Failed to delete session: ${response.status}`);
            }

            setUserData(prev => ({
                ...prev,
                sessions: prev.sessions.filter(session => session.id !== sessionId)
            }));
        } catch (error) {
            console.error('Error deleting session:', error);
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
                                        // Store session ID in closure but don't display it
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