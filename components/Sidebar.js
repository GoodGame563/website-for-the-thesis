import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Sidebar.module.css';
import Button from './Button';
import { TokenManager } from '../utils/tokenManager';
import { useRouter } from 'next/router';
import AccountModal from './AccountModal';

export default function Sidebar({ onNewRequest, onTaskSelect }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [todayTasks, setTodayTasks] = useState([]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [originalNames, setOriginalNames] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const sidebarRef = useRef(null);
  const taskNameRefs = useRef({});

  // Добавляем эффект для отслеживания изменения isActive
  useEffect(() => {
    if (!isActive && editingTaskId) {
      setEditingTaskId(null);
      setEditedName('');
    }
  }, [isActive]);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    
    // Автоматически удаляем уведомление через 3 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  };

  const handleToggleClick = async (e) => {
    e.stopPropagation();
    setIsActive(!isActive);
    if (!isActive) {
      setIsLoading(true);
      try {
        const token = await TokenManager.getValidAccessToken();
        if (!token) {
          throw new Error('Ошибка авторизации');
        }

        const response = await fetch('http://127.0.0.1:8000/api/v1/get/history', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка получения задач');
        }

        const data = await response.json();
        const tasks = data.elements || [];
        console.log('Tasks from API:', tasks);

        // Get current date in UTC
        const now = new Date();
        const todayStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        ));

        // Sort tasks into today and older
        const todayTasksList = [];
        const otherTasksList = [];

        tasks.forEach(task => {
          const taskDate = new Date(task.createdAt);
          if (taskDate >= todayStart) {
            todayTasksList.push(task);
          } else {
            otherTasksList.push(task);
          }
        });

        // Sort both lists by creation date (newest first)
        todayTasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        otherTasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
      const token = await TokenManager.getValidAccessToken();
      if (!token) {
        throw new Error('Ошибка авторизации');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/v1/get/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: taskId
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка получения данных задачи');
      }

      const taskData = await response.json();
      console.log('Task data from API:', taskData);

      // Добавляем id задачи к данным перед отправкой
      const taskDataWithId = {
        ...taskData,
        id: taskId
      };

      // Передаем данные через callback
      if (onTaskSelect) {
        onTaskSelect(taskDataWithId);
      }
    } catch (error) {
      console.error('Error fetching task data:', error);
      // Добавляем уведомление об ошибке
      addNotification('Ошибка при получении данных задачи');
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

  const sidebarVariants = {
    hidden: { 
      x: '-100%', 
      transition: { 
        type: "tween",
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] 
      } 
    },
    visible: { 
      x: 0, 
      transition: { 
        type: "tween",
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      } 
    },
    exit: { 
      x: '-100%', 
      transition: { 
        type: "tween",
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      } 
    }
  };

  const taskVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const handleEditClick = (e, task) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditedName(task.name);
    setOriginalNames(prev => ({...prev, [task.id]: task.name}));
  };

  const handleSaveClick = async (e, taskId) => {
    e.stopPropagation();
    if (editedName === originalNames[taskId]) {
      setEditingTaskId(null);
      return;
    }

    if (editedName.length > 100) {
      addNotification('Название задачи не может быть длиннее 100 символов');
      return;
    }

    try {
      const token = await TokenManager.getValidAccessToken();
      if (!token) {
        throw new Error('Ошибка авторизации');
      }

      const response = await fetch(`http://127.0.0.1:8000/api/v1/edit/task`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: taskId,
          newName: editedName
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка сохранения изменений');
      }

      // Обновляем название в списках задач
      setTodayTasks(prev => prev.map(task => 
        task.id === taskId ? {...task, name: editedName} : task
      ));
      setOtherTasks(prev => prev.map(task => 
        task.id === taskId ? {...task, name: editedName} : task
      ));

      setEditingTaskId(null);
    } catch (error) {
      console.error('Error saving task name:', error);
    }
  };

  const measureTextWidth = (text) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = getComputedStyle(document.body).font;
    return context.measureText(text).width;
  };

  const checkNameFits = (name, taskId) => {
    if (!taskNameRefs.current[taskId]) return true;
    const containerWidth = taskNameRefs.current[taskId].offsetWidth - 40; // 40px для кнопки
    const textWidth = measureTextWidth(name);
    return textWidth <= containerWidth;
  };

  const getDisplayName = (name, taskId) => {
    if (!taskNameRefs.current[taskId]) return name;
    if (checkNameFits(name, taskId)) return name;
    
    let truncated = name;
    while (truncated.length > 0 && !checkNameFits(truncated + '...', taskId)) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  };

  const renderTaskItem = (task, containerType) => (
    <motion.div
      key={task.id}
      data-task-id={task.id}
      className={styles.taskItem}
      variants={taskVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={() => handleTaskClick(task.id)}
      style={{ cursor: 'pointer' }}
      ref={el => taskNameRefs.current[task.id] = el}
    >
      {editingTaskId === task.id ? (
        <div className={styles.editContainer} onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className={styles.editInput}
            autoFocus
          />
          <button 
            className={styles.saveButton} 
            onClick={(e) => handleSaveClick(e, task.id)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      ) : (
        <>
          <span>{getDisplayName(task.name, task.id)}</span>
          <button 
            className={styles.editButton}
            onClick={(e) => handleEditClick(e, task)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
            </svg>
          </button>
        </>
      )}
    </motion.div>
  );

  const handleAccountClick = () => {
    setIsAccountModalOpen(true);
    setIsActive(false);
  };

  return (
    <>
      <div className={styles.notificationList}>
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              className={styles.notification}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {notif.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className={styles.toggleBtn}>
        <Button onClick={handleToggleClick} className={styles.toggleBtn}>
          <motion.svg 
            viewBox="0 0 24 24" 
            width="24" 
            height="24" 
            style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
          </motion.svg>
        </Button>
      </div>
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            ref={sidebarRef}
            className={styles.sidebar}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationComplete={(definition) => {
              if (definition === "exit") {
                setIsActive(false);
              }
            }}
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
                  todayTasks.map(task => renderTaskItem(task, 'today'))
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
                  otherTasks.map(task => renderTaskItem(task, 'other'))
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
            
            <div className={styles.accountButtonContainer}>
              <Button onClick={handleAccountClick} className={styles.accountButton}>
                Аккаунт
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </>
  );
}