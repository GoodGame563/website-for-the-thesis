import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { TokenManager } from '../utils/tokenManager';
import RegisterForm from '../components/RegisterForm';


export default function RegisterPage() {
  const [registerError, setRegisterError] = useState('');
  const router = useRouter();

  const handleRegisterSuccess = () => {
    router.push('/login');
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
      {registerError && (
        <div className="error-message">
          {registerError}
        </div>
      )}
      <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
    </motion.div>
  );
}
