import { useState } from "react";
import styles from "../styles/Button.module.css";

export default function Button({ children, onClick, className = "", isLoading = false, disabled = false }) {
    const [rippleEffect, setRippleEffect] = useState(false);

    const handleClick = (e) => {
        if (disabled || isLoading) return;

        setRippleEffect(true);
        setTimeout(() => setRippleEffect(false), 600);

        if (onClick) {
            onClick(e);
        }
    };

    const buttonClassName = `${styles.btn} ${className} ${disabled ? styles.disabled : ""} ${isLoading ? styles.loading : ""}`;

    return (
        <button className={buttonClassName} onClick={handleClick} disabled={disabled}>
            <div className={`${styles.buttonContent} ${isLoading ? styles.loading : ""}`}>
                <span>{children}</span>
                <div className={styles.loader} />
            </div>
            {rippleEffect && <div className={styles.waveEffect} />}
        </button>
    );
}