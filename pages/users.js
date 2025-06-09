import React from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Users.module.css';

const users = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@example.com', subscription: 'Нет' },
  { id: 2, name: 'Мария Петрова', email: 'maria@example.com', subscription: 'Активна' },
  { id: 3, name: 'Алексей Смирнов', email: 'alexey@example.com', subscription: 'Нет' },
];

const Users = () => {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => router.push('/requests')}>Назад</button>
      <h1 className={styles.title}>Пользователи</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Подписка</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.subscription}</td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.actionBtn}>Оформить подписку</button>
                  <button className={styles.actionBtn}>Повысить до администратора</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
