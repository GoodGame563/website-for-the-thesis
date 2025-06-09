import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Users.module.css';
import { ApiClient } from '../utils/ApiClient';
const apiClient = new ApiClient();

function getSubscriptionStatus(subscription) {
  if (!subscription || !subscription.expiresAt) return 'Нет';
  const expiresAt = new Date(subscription.expiresAt);
  const now = new Date();
  if (expiresAt > now) return 'Активна';
  return 'Нет';
}

const Users = () => {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await apiClient.getUsers();
      if (res.type === 'Ok') {
        setUsers(res.body);
      } else {
        setError(res.body);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleOpenModal = (userId) => {
    setSelectedUserId(userId);
    console.log(userId);
    setSelectedDate('');
    setDateError('');
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUserId(null);
    setSelectedDate('');
    setDateError('');
  };
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setDateError('');
  };
  const handleSave = async () => {
    const today = new Date();
    const chosen = new Date(selectedDate);
    today.setHours(0,0,0,0);
    chosen.setHours(0,0,0,0);
    if (!selectedDate || chosen <= today) {
      setDateError('Дата должна быть больше сегодняшней!');
      return;
    }
    const payload = {
      created_at: today.toISOString(),
      valid_to: chosen.toISOString(),
      user_id: selectedUserId
    };
    try {
      const res = await apiClient.request('/add/subscribe', 'POST', payload, true);
      if (res.type !== 'Ok') {
        setDateError(res.body || 'Ошибка при оформлении подписки');
        return;
      }
      const usersRes = await apiClient.getUsers();
      if (usersRes.type === 'Ok') {
        setUsers(usersRes.body);
      }
      handleCloseModal();
    } catch (e) {
      setDateError('Ошибка сети или сервера');
    }
  };

  const handleAdminChange = async (userId, isAdmin) => {
    try {
      const res = await apiClient.request('/edit/admin', 'POST', {
        is_admin: !isAdmin,
        user_id: userId
      }, true);
      if (res.type === 'Ok') {
        const usersRes = await apiClient.getUsers();
        if (usersRes.type === 'Ok') {
          setUsers(usersRes.body);
        }
      } else {
        setNotification('Ошибка при изменении роли администратора');
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      setNotification('Ошибка сети или сервера');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className={styles.container}>
      {notification && (
        <div className={styles.notification}>{notification}</div>
      )}
      <button className={styles.backBtn} onClick={() => router.push('/requests')}>Назад</button>
      <h1 className={styles.title}>Пользователи</h1>
      {loading ? (
        <div>Загрузка...</div>
      ) : error ? (
        <div style={{color: 'red'}}>Ошибка: {error}</div>
      ) : (
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
            <tr key={user.id} data-user-id={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{getSubscriptionStatus(user.subscription)}</td>
              <td>
                <div className={styles.actions}>
                  <button
                    className={styles.actionBtn}
                    data-user-id={user.id}
                    onClick={() => handleOpenModal(user.id)}
                    disabled={getSubscriptionStatus(user.subscription) === 'Активна'}
                    style={getSubscriptionStatus(user.subscription) === 'Активна' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                    Оформить подписку
                  </button>
                  {user.isAdmin ? (
                    <button
                      className={styles.actionBtn}
                      data-user-id={user.id}
                      onClick={() => handleAdminChange(user.id, true)}
                    >
                      Убрать роль администратора
                    </button>
                  ) : (
                    <button
                      className={styles.actionBtn}
                      data-user-id={user.id}
                      onClick={() => handleAdminChange(user.id, false)}
                    >
                      Повысить до администратора
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      {modalOpen && (
  <div className={styles.modalOverlay}>
    <div className={styles.modalWindow}>
      <h2>Оформить подписку</h2>
      <label>
        Дата окончания подписки:
        <input type="date" value={selectedDate} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} />
      </label>
      {dateError && <div className={styles.errorMsg}>{dateError}</div>}
      <div className={styles.modalActions}>
        <button className={styles.saveBtn} onClick={handleSave}>Сохранить</button>
        <button className={styles.cancelBtn} onClick={handleCloseModal}>Отмена</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Users;
