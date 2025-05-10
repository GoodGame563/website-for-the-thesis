import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/LoginForm.module.css";
import Button from "./Button";
import { TokenManager } from "../utils/tokenManager";
import { ApiClient } from "../utils/ApiClient";
const apiClient = new ApiClient();

export default function LoginForm({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const [notifications, setNotifications] = useState([]);

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const addNotification = useCallback((message) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        }, 3000);
    }, []);

    const showError = (error, setter) => {
        setter(error);
    };

    const validateInput = (value, regex, errorSetter, errorMessage) => {
        if (!value.trim()) {
            showError(errorMessage.toLowerCase(), errorSetter);
            return false;
        }
        if (!regex.test(value)) {
            showError(errorMessage.toLowerCase(), errorSetter);
            return false;
        }
        errorSetter("");
        return true;
    };

    const handleLogin = async () => {
        setEmailError("");
        setPasswordError("");

        const isEmailValid = validateInput(email, emailRegex, setEmailError, "Пожалуйста, введите корректный email");

        if (!password.trim()) {
            showError("Пожалуйста, введите пароль", setPasswordError);
            return;
        }

        if (!isEmailValid) return;

        setIsLoading(true);
        const response = await apiClient.login(email, password);

        if (response.type === "ErrorSystem") {
            addNotification(response.body);
            setIsLoading(false);
            return;
        }
        if (response.type === "Error") {
            console.log(response.body);
            showError(response.body, setEmailError);
            setIsLoading(false);
            return;
        }

        const data = await response.body;
        TokenManager.setTokens(data);
        onLoginSuccess();
    };

    const inputShake = {
        shake: {
            x: [0, -5, 5, -5, 0],
            transition: { duration: 0.3, ease: "easeInOut" },
        },
    };

    const errorVariants = {
        hidden: { opacity: 0, y: -5 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    };

    return (
        <div className={styles.container}>
            <div className={styles.notificationList}>
                <AnimatePresence>
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
            <h1>Вход</h1>
            <motion.input
                ref={emailInputRef}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${styles.input} ${emailError ? styles.error : ""}`}
                variants={inputShake}
                animate={emailError ? "shake" : undefined}
            />
            <motion.div
                className={styles.errorMessage}
                variants={errorVariants}
                initial="hidden"
                animate={emailError ? "visible" : "hidden"}
            >
                {emailError}
            </motion.div>
            <motion.input
                ref={passwordInputRef}
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${styles.input} ${passwordError ? styles.error : ""}`}
                variants={inputShake}
                animate={passwordError ? "shake" : undefined}
            />
            <motion.div
                className={styles.errorMessage}
                variants={errorVariants}
                initial="hidden"
                animate={passwordError ? "visible" : "hidden"}
            >
                {passwordError}
            </motion.div>
            <Button onClick={handleLogin} disabled={isLoading} isLoading={isLoading}>
                {isLoading ? <div className={styles.loading}></div> : "Войти"}
            </Button>
        </div>
    );
}