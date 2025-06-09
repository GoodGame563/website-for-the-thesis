import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoginForm from '../components/LoginForm';
import { TokenManager } from '../utils/tokenManager';

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
       const token = await TokenManager.getValidAccessToken();
        if (token.type === 'Ok') {
            router.push('/requests');
        }
    };
    checkAuth();
  }, [router]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    router.push('/requests');
  };

  const pageVariants = {
    initial: { opacity: 0, x: '-100%' },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
    exit: { opacity: 0, x: '100%', transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  return (
    <motion.div
      className="window"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {loginError && (
        <div className="error-message">
          {loginError}
        </div>
      )}
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </motion.div>
  );
}