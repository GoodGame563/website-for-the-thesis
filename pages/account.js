import { useEffect, useState } from 'react';
import styles from '../styles/Account.module.css';
import { useRouter } from 'next/router';
import Button from '../components/Button';
import { TokenManager } from '../utils/tokenManager';
import { handleFetchError } from '../utils/fetchErrorHandler';

export default function Account() {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        sessions: []
    });
    const router = useRouter();

    useEffect(() => {
        if (!TokenManager.hasValidTokens()) {
            router.replace('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const token = await TokenManager.getValidAccessToken();
                if (!token) {
                    TokenManager.clearTokens();
                    router.replace('/login');
                    return;
                }

                const response = await fetch('http://localhost:8000/api/v1/get/account', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const error = new Error('Failed to fetch account data');
                    error.status = response.status;
                    throw error;
                }

                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                await handleFetchError(error, fetchUserData);
            }
        };

        fetchUserData();
    }, [router]);

    const handleLogout = async () => {
        try {
            const token = await TokenManager.getValidAccessToken();
            if (!token) {
                TokenManager.clearTokens();
                router.push('/login');
                return;
            }

            const response = await fetch('http://localhost:8000/api/v1/exit', {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = new Error('Failed to logout');
                error.status = response.status;
                throw error;
            }

            TokenManager.clearTokens();
            router.push('/login');
        } catch (error) {
            console.error('Error during logout:', error);
            await handleFetchError(error, handleLogout);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date)) {
            return 'Некорректная дата';
        }
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.userInfo}>
                    <h1 className={styles.userName}>{userData.name}</h1>
                    <p className={styles.userEmail}>{userData.email}</p>
                </div>
                
                <Button onClick={handleLogout} className={styles.logoutButton}>
                    Выйти из аккаунта
                </Button>

                <div className={styles.sessionsContainer}>
                    <h2>Активные сессии</h2>
                    <div className={styles.sessionsList}>
                        {(() => {
                            console.log('Сессии до сортировки:', userData.sessions);
                            const sortedSessions = userData.sessions
                                .filter(session => session.lastActivity)
                                .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
                            console.log('Сессии после сортировки:', sortedSessions);
                            return sortedSessions.map(session => (
                                <div key={session.id} className={styles.sessionItem}>
                                    <p>Браузер: {session.browser || 'Неизвестно'}</p>
                                    <p>Последняя активность: {formatDate(session.lastActivity)}</p>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}