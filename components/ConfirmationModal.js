import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/ConfirmationModal.module.css';
import Button from './Button';

export default function ConfirmationModal({ isVisible, onConfirm, onCancel, message }) {
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={styles.modalContent}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <p>{message}</p>
            <div className={styles.buttonContainer}>
              <Button onClick={onConfirm} className={styles.confirmButton}>
                Сохранить
              </Button>
              <Button onClick={onCancel} className={styles.cancelButton}>
                Отменить
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}