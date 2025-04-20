import { useEffect, useState } from 'react';
import styles from '../styles/Account.module.css';
import { useRouter } from 'next/router';
import Button from '../components/Button';
import { TokenManager } from '../utils/tokenManager';

export default function Account() {
    const [userData, setUserData] = useState({
        name: '',
        sessions: []
    });
    const router = useRouter();

    useEffect(() => {
        if (!TokenManager.hasValidTokens()) {
            router.replace('/login');
            return;
        }

        const checkAuth = async () => {
            const token = await TokenManager.getValidAccessToken();
            if (!token) {
                TokenManager.clearTokens();
                router.replace('/login');
            }
        };
        checkAuth();

        // Here you would fetch user data from your backend
        // This is a placeholder
        const mockUserData = {
            name: 'John Doe',
            sessions: [
                { id: 1, date: '2025-04-19', device: 'Chrome Windows' },
                { id: 2, date: '2025-04-18', device: 'Firefox Windows' }
            ]
        };
        setUserData(mockUserData);
    }, [router]);

    const handleLogout = () => {
        // Add logout logic here
        router.push('/login');
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.userName}>{userData.name}</h1>
                
                <Button onClick={handleLogout} className={styles.logoutButton}>
                    Выйти из аккаунта
                </Button>

                <div className={styles.sessionsContainer}>
                    <h2>Активные сессии</h2>
                    <div className={styles.sessionsList}>
                        {userData.sessions.map(session => (
                            <div key={session.id} className={styles.sessionItem}>
                                <p>Дата: {session.date}</p>
                                <p>Устройство: {session.device}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}