import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/Sidebar.module.css";
import Button from "./Button";
import { TokenManager } from "../utils/tokenManager";
import { useRouter } from "next/router";
import AccountModal from "./AccountModal";
import { ApiClient } from "../utils/ApiClient";
const apiClient = new ApiClient();

export default function Sidebar({ onNewRequest, onTaskSelect }) {
    const router = useRouter();
    const [isActive, setIsActive] = useState(false);
    const [todayTasks, setTodayTasks] = useState([]);
    const [otherTasks, setOtherTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editedName, setEditedName] = useState("");
    const [originalNames, setOriginalNames] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const sidebarRef = useRef(null);
    const taskNameRefs = useRef({});

    useEffect(() => {
        if (!isActive && editingTaskId) {
            setEditingTaskId(null);
            setEditedName("");
        }
    }, [isActive]);

    const addNotification = (message) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 3000);
    };

    const handleToggleClick = async (e) => {
        e.stopPropagation();
        setIsActive(!isActive);
        if (!isActive) {
            setIsLoading(true);
            try {
                const adminResponse = await apiClient.checkAdmin?.();
                if (adminResponse.type === 'Ok') {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch {
                setIsAdmin(false);
            }

            const fetchTasks = async () => {
                let attempts = 0;
                const maxAttempts = 2;
                while (attempts < maxAttempts) {
                    const response = await apiClient.getHistory();
                    if (response.type === "ErrorSystem") {
                        addNotification(response.body);
                        return null;
                    }
                    if (response.type === "ErrorToken") {
                        attempts++;
                        const result = await TokenManager.refreshTokens();
                        if (result === "err") {
                            addNotification(response.body);
                            setTimeout(router.replace, 3000, "/login");
                            return null;
                        }
                        if (attempts === maxAttempts) {
                            addNotification(response.body);
                            setTimeout(router.replace, 3000, "/login");
                            return null;
                        }
                        continue;
                    }

                    const data = await response.body;
                    return data;
                }
            };

            const data = await fetchTasks();
            const tasks = (data && data.elements) || [];
            console.log("Tasks from API:", tasks);

            const now = new Date();
            const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

            const todayTasksList = [];
            const otherTasksList = [];

            tasks.forEach((task) => {
                const taskDate = new Date(task.createdAt);
                if (taskDate >= todayStart) {
                    todayTasksList.push(task);
                } else {
                    otherTasksList.push(task);
                }
            });

            todayTasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            otherTasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setTodayTasks(todayTasksList);
            setOtherTasks(otherTasksList);
            setIsLoading(false);
        }
    };

    const handleNewRequest = () => {
        if (onNewRequest) {
            onNewRequest();
        }
    };

    const handleTaskClick = async (taskId) => {
        setIsLoading(true);
        const fetchTask = async () => {
            let attempts = 0;
            const maxAttempts = 2;
            while (attempts < maxAttempts) {
                const response = await apiClient.getTask(taskId);
                if (response.type === "ErrorSystem") {
                    addNotification(response.body);
                    return null;
                }
                if (response.type === "ErrorToken") {
                    attempts++;
                    const result = await TokenManager.refreshTokens();
                    if (result === "err") {
                        addNotification(response.body);
                        setTimeout(router.replace, 3000, "/login");
                        return null;
                    }
                    if (attempts === maxAttempts) {
                        addNotification(response.body);
                        setTimeout(router.replace, 3000, "/login");
                        return null;
                    }
                    continue;
                }

                const taskData = await response.body;
                return taskData;
            }
        };

        const taskData = await fetchTask();
        console.log("Task data from API:", taskData);
        const taskDataWithId = {
            ...taskData,
            id: taskId,
            isRestored: true,
        };

        if (onTaskSelect) {
            onTaskSelect(taskDataWithId);
        }

        setIsLoading(false);
    };

    const handleOutsideClick = (e) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
            setIsActive(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            document.addEventListener("click", handleOutsideClick);
        } else {
            document.removeEventListener("click", handleOutsideClick);
        }
        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, [isActive]);

    const truncateName = (name) => (name.length > 15 ? `${name.slice(0, 15)}...` : name);

    const sidebarVariants = {
        hidden: {
            x: "-100%",
            transition: {
                type: "tween",
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
            },
        },
        visible: {
            x: 0,
            transition: {
                type: "tween",
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
            },
        },
        exit: {
            x: "-100%",
            transition: {
                type: "tween",
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
            },
        },
    };

    const taskVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
    };

    const handleEditClick = (e, task) => {
        e.stopPropagation();
        setEditingTaskId(task.id);
        setEditedName(task.name);
        setOriginalNames((prev) => ({ ...prev, [task.id]: task.name }));
    };

    const handleSaveClick = async (e, taskId) => {
        e.stopPropagation();
        if (editedName === originalNames[taskId]) {
            setEditingTaskId(null);
            return;
        }

        if (editedName.length > 100) {
            addNotification("Название задачи не может быть длиннее 100 символов");
            return;
        }
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
            const response = await apiClient.editTask(taskId, editedName);
            if (response.type === "ErrorSystem") {
                addNotification(response.body);
                return null;
            }
            if (response.type === "ErrorToken") {
                attempts++;
                const result = await TokenManager.refreshTokens();
                if (result === "err") {
                    addNotification(response.body);
                    setTimeout(router.replace, 3000, "/login");
                    return null;
                }
                if (attempts === maxAttempts) {
                    addNotification(response.body);
                    setTimeout(router.replace, 3000, "/login");
                    return null;
                }
                continue;
            }
            if (response.type === 'Ok'){
                setEditingTaskId(null);
                return;
            }

            setTodayTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, name: editedName } : task)));
            setOtherTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, name: editedName } : task)));

            setEditingTaskId(null);
            return;
        }
    };

    const measureTextWidth = (text) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = getComputedStyle(document.body).font;
        return context.measureText(text).width;
    };

    const checkNameFits = (name, taskId) => {
        if (!taskNameRefs.current[taskId]) return true;
        const containerWidth = taskNameRefs.current[taskId].offsetWidth - 40;
        const textWidth = measureTextWidth(name);
        return textWidth <= containerWidth;
    };

    const getDisplayName = (name, taskId) => {
        if (!taskNameRefs.current[taskId]) return name;
        if (checkNameFits(name, taskId)) return name;

        let truncated = name;
        while (truncated.length > 0 && !checkNameFits(truncated + "...", taskId)) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + "...";
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
            style={{ cursor: "pointer" }}
            ref={(el) => (taskNameRefs.current[task.id] = el)}
        >
            {editingTaskId === task.id ? (
                <div className={styles.editContainer} onClick={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                    />
                    <button className={styles.saveButton} onClick={(e) => handleSaveClick(e, task.id)}>
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            ) : (
                <>
                    <span>{getDisplayName(task.name, task.id)}</span>
                    <button className={styles.editButton} onClick={(e) => handleEditClick(e, task)}>
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path
                                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                                fill="currentColor"
                            />
                        </svg>
                    </button>
                    <button
                        className={styles.deleteButton}
                        onClick={async (e) => {
                            e.stopPropagation();
                            const response = await apiClient.deleteTask(task.id);
                            if (response && response.type === 'Ok') {
                                addNotification('Задача удалена');
                                await refetchTasks();
                            } else {
                                addNotification('Ошибка при удалении задачи');
                            }
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                        </svg>
                    </button>
                </>
            )}
        </motion.div>
    );

    const refetchTasks = async () => {
        setIsLoading(true);
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
            const response = await apiClient.getHistory();
            if (response.type === "ErrorSystem") {
                addNotification(response.body);
                setIsLoading(false);
                return;
            }
            if (response.type === "ErrorToken") {
                attempts++;
                const result = await TokenManager.refreshTokens();
                if (result === "err") {
                    addNotification(response.body);
                    setTimeout(router.replace, 3000, "/login");
                    setIsLoading(false);
                    return;
                }
                if (attempts === maxAttempts) {
                    addNotification(response.body);
                    setTimeout(router.replace, 3000, "/login");
                    setIsLoading(false);
                    return;
                }
                continue;
            }
            const data = await response.body;
            const tasks = (data && data.elements) || [];
            const now = new Date();
            const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const todayTasksList = [];
            const otherTasksList = [];
            tasks.forEach((task) => {
                const taskDate = new Date(task.createdAt);
                if (taskDate >= todayStart) {
                    todayTasksList.push(task);
                } else {
                    otherTasksList.push(task);
                }
            });
            todayTasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            otherTasksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTodayTasks(todayTasksList);
            setOtherTasks(otherTasksList);
            setIsLoading(false);
            return;
        }
    };

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
                        style={{ fill: "none", stroke: "currentColor", strokeWidth: 2 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
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
                                    todayTasks.map((task) => renderTaskItem(task, "today"))
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
                                    otherTasks.map((task) => renderTaskItem(task, "other"))
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
                        <div style={{ flex: 1 }} />
                        <div className={styles.accountButtonsRow} style={{ marginBottom: 0, marginTop: 'auto', width: '100%' }}>
                            <Button onClick={handleAccountClick} className={styles.accountButton}>
                                Аккаунт
                            </Button>
                            {isAdmin && (
                                <Button onClick={() => router.push('/users')} className={styles.accountButton}>
                                    Пользователи
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} />
        </>
    );
}