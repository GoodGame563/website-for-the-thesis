import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import AnalysisForm from '../components/AnalysisForm';
import Sidebar from '../components/Sidebar';
import { TokenManager } from '../utils/tokenManager';

export default function RequestsPage() {
  const router = useRouter();
  const resetFormRef = useRef(null);
  const fillFormRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
       const token = await TokenManager.getValidAccessToken();
        if (token.type === 'Error') {
          router.replace('/login');
        }
    };
    checkAuth();
  }, [router]);

  const pageVariants = {
    initial: { opacity: 0, x: '100%' },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
    exit: { opacity: 0, x: '-100%', transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  const handleNewRequest = () => {
    if (resetFormRef.current) {
      resetFormRef.current();
    }
  };

  const handleTaskSelect = (taskData) => {
    if (fillFormRef.current) {
      fillFormRef.current(taskData);
    }
  };

  return (
    <motion.div
      className="app-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AnalysisForm onReset={resetFormRef} onFill={fillFormRef} />
      <Sidebar onNewRequest={handleNewRequest} onTaskSelect={handleTaskSelect} />
    </motion.div>
  );
}