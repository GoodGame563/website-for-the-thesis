import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken && refreshToken) {
      setIsAuthenticated(true);
      router.push('/requests');
    }
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
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </motion.div>
  );
}