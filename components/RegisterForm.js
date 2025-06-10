import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/LoginForm.module.css";
import Button from "./Button";
import { ApiClient } from "../utils/ApiClient";
const apiClient = new ApiClient();

export default function RegisterForm({ onRegisterSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 3000);
  };

  const validateInput = (value, regex, errorSetter, errorMessage) => {
    if (!value.trim()) {
      errorSetter(errorMessage);
      return false;
    }
    if (regex && !regex.test(value)) {
      errorSetter(errorMessage);
      return false;
    }
    errorSetter("");
    return true;
  };

  const handleRegister = async () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    const isNameValid = validateInput(name, null, setNameError, "Пожалуйста, введите имя");
    const isEmailValid = validateInput(email, emailRegex, setEmailError, "Пожалуйста, введите корректный email");
    const isPasswordValid = validateInput(password, passwordRegex, setPasswordError, "Пароль должен быть не менее 6 символов, содержать буквы, цифры и спецсимвол");
    if (!isNameValid || !isEmailValid || !isPasswordValid) return;
    setIsLoading(true);
    const response = await apiClient.register(name, email, password);
    if (response.type === "ErrorSystem" || response.type === "Error") {
      addNotification(response.body || "Ошибка регистрации");
      setIsLoading(false);
      return;
    }
    onRegisterSuccess();
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
      <h1>Регистрация</h1>
      <input
        type="text"
        placeholder="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`${styles.input} ${nameError ? styles.error : ""}`}
      />
      <div className={styles.errorMessage}>{nameError}</div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`${styles.input} ${emailError ? styles.error : ""}`}
      />
      <div className={styles.errorMessage}>{emailError}</div>
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${styles.input} ${passwordError ? styles.error : ""}`}
      />
      <div className={styles.errorMessage}>{passwordError}</div>
      <Button onClick={handleRegister} disabled={isLoading} isLoading={isLoading}>
        {isLoading ? <div className={styles.loading}></div> : "Зарегистрироваться"}
      </Button>
    </div>
  );
}
