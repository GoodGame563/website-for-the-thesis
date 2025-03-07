import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Sidebar.module.css';
import Button from './Button';

export default function Sidebar({ onNewRequest, onTaskSelect }) {
  const [isActive, setIsActive] = useState(false);
  const [todayTasks, setTodayTasks] = useState([]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  const sidebarVariants = {
    hidden: { x: '-100%', opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } }, // Добавлена анимация исчезновения
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeInOut' } }, // Появление
  };

  const taskVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const handleToggleClick = async (e) => {
    e.stopPropagation();
    setIsActive(!isActive);

    if (!isActive) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://127.0.0.1:8000/get/history', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка получения задач');
        }

        const tasks = await response.json();
        console.log('Tasks from API:', tasks);

        const todayTasksList = tasks.filter(task => task.updated.split('T')[0] === today);
        const otherTasksList = tasks.filter(task => task.updated.split('T')[0] !== today);

        setTodayTasks(todayTasksList);
        setOtherTasks(otherTasksList);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNewRequest = () => {
    if (onNewRequest) {
      onNewRequest();
    }
  };

  const handleTaskClick = async (taskId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://127.0.0.1:8000/get/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка получения данных задачи');
      }

      const taskData = await response.json();
      console.log('Task data from API:', taskData);

      if (onTaskSelect) {
        onTaskSelect(taskData);
      }
    } catch (error) {
      console.error('Error fetching task data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutsideClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setIsActive(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      document.addEventListener('click', handleOutsideClick);
    } else {
      document.removeEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isActive]);

  const truncateName = (name) => name.length > 15 ? `${name.slice(0, 15)}...` : name;

  return (
    <>
      <div className={styles.toggleBtn}>
        <Button onClick={handleToggleClick} className={styles.toggleBtn}>
          <svg viewBox="0 0 24 24" width="66" height="66" color="#FFF" fill="none">
            <path d="M4 5L20 5" stroke="currentColor" />
            <path d="M4 12L20 12" stroke="currentColor" />
            <path d="M4 19L20 19" stroke="currentColor" />
          </svg>
        </Button>
      </div>
      <AnimatePresence>
        {isActive && (
          <motion.div
            ref={sidebarRef}
            className={`${styles.sidebar} ${styles.visible}`}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden" // Добавлено для анимации исчезновения
          >
            <h2>Анализы</h2>
            <Button className={styles.newRequestBtn} onClick={handleNewRequest}>
              Новый запрос
            </Button>
            <h3>Сегодня</h3>
            <div className={styles.taskContainer}>
              <AnimatePresence>
                {isLoading ? (
                  <p>Загрузка...</p>
                ) : todayTasks.length > 0 ? (
                  todayTasks.map(task => (
                    <motion.div
                      key={task.id}
                      className={`${styles.taskItem} ${task.status === 'active' ? styles.active : styles.inactive}`}
                      variants={taskVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => handleTaskClick(task.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{truncateName(task.name)}</span>
                      <span className={styles.statusIcon}>
                        {task.status === 'active' ? '✔' : '✘'}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="no-today"
                    className={styles.taskItem}
                    variants={taskVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    Нет задач на сегодня
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className={styles.storageInfo}>Хранилище 30 дней</div>
            <div className={styles.taskContainer}>
              <AnimatePresence>
                {isLoading ? (
                  <p>Загрузка...</p>
                ) : otherTasks.length > 0 ? (
                  otherTasks.map(task => (
                    <motion.div
                      key={task.id}
                      className={`${styles.taskItem} ${task.status === 'active' ? styles.active : styles.inactive}`}
                      variants={taskVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => handleTaskClick(task.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{truncateName(task.name)}</span>
                      <span className={styles.statusIcon}>
                        {task.status === 'active' ? '✔' : '✘'}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="no-other"
                    className={styles.taskItem}
                    variants={taskVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    Нет других задач
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}