import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/AccountModal.module.css';
import Button from './Button';
import { useRouter } from 'next/router';

export default function AccountModal({ isOpen, onClose }) {
    const [userData, setUserData] = useState({
        name: '',
        sessions: []
    });
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            // Here you would fetch user data from your backend
            // This is a placeholder
            const mockUserData = {
                name: 'John Doe',
                sessions: [
                    { 
                        id: 1, 
                        lastAction: 'Анализ текста', 
                        device: 'Chrome Windows',
                        lastActionTime: '2 минуты назад'
                    },
                    { 
                        id: 2, 
                        lastAction: 'Просмотр истории', 
                        device: 'Firefox Windows',
                        lastActionTime: '1 час назад'
                    },
                    // Добавим больше сессий для тестирования прокрутки
                    { 
                        id: 3, 
                        lastAction: 'Вход в систему', 
                        device: 'Safari MacOS',
                        lastActionTime: '3 часа назад'
                    }
                ]
            };
            setUserData(mockUserData);
        }
    }, [isOpen]);

    const handleLogout = () => {
        // Add logout logic here
        router.push('/login');
        onClose();
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        try {
            // Здесь будет запрос к API для удаления сессии
            // await deleteSession(sessionId);
            
            // Обновляем локальное состояние
            setUserData(prev => ({
                ...prev,
                sessions: prev.sessions.filter(session => session.id !== sessionId)
            }));
        } catch (error) {
            console.error('Error deleting session:', error);
        }
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
                            <h1 className={styles.userName}>{userData.name}</h1>
                            
                            <div className={styles.sessionsContainer}>
                                <h2>Активные сессии</h2>
                                <div className={styles.sessionsList}>
                                    {userData.sessions.map(session => (
                                        <motion.div 
                                            key={session.id} 
                                            className={styles.sessionItem}
                                            whileHover={{ 
                                                scale: 1.02,
                                                transition: { type: "spring", stiffness: 400, damping: 25 }
                                            }}
                                            layout // Добавляем layout для плавной анимации позиционирования
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <div className={styles.sessionInfo}>
                                                <div className={styles.sessionDetails}>
                                                    <p className={styles.lastAction}>
                                                        {session.lastAction}
                                                        <span className={styles.lastActionTime}>
                                                            {session.lastActionTime}
                                                        </span>
                                                    </p>
                                                    <p className={styles.deviceInfo}>{session.device}</p>
                                                </div>
                                                <motion.button
                                                    className={styles.deleteButton}
                                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="24" height="24">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                                                    </svg>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
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