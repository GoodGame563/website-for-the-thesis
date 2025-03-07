import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Overlay.module.css';
import Button from './Button';
import Carousel from './Carousel';

// Определение домена Wildberries
const getUrl = (nomenclature) => {
  if (0 <= nomenclature && nomenclature <= 143) return "basket-01.wbbasket.ru";
  if (144 <= nomenclature && nomenclature <= 287) return "basket-02.wbbasket.ru";
  if (288 <= nomenclature && nomenclature <= 431) return "basket-03.wbbasket.ru";
  if (432 <= nomenclature && nomenclature <= 719) return "basket-04.wbbasket.ru";
  if (720 <= nomenclature && nomenclature <= 1007) return "basket-05.wbbasket.ru";
  if (1008 <= nomenclature && nomenclature <= 1061) return "basket-06.wbbasket.ru";
  if (1062 <= nomenclature && nomenclature <= 1115) return "basket-07.wbbasket.ru";
  if (1116 <= nomenclature && nomenclature <= 1169) return "basket-08.wbbasket.ru";
  if (1170 <= nomenclature && nomenclature <= 1313) return "basket-09.wbbasket.ru";
  if (1314 <= nomenclature && nomenclature <= 1601) return "basket-10.wbbasket.ru";
  if (1602 <= nomenclature && nomenclature <= 1655) return "basket-11.wbbasket.ru";
  if (1656 <= nomenclature && nomenclature <= 1919) return "basket-12.wbbasket.ru";
  if (1920 <= nomenclature && nomenclature <= 2045) return "basket-13.wbbasket.ru";
  if (2046 <= nomenclature && nomenclature <= 2189) return "basket-14.wbbasket.ru";
  if (2190 <= nomenclature && nomenclature <= 2405) return "basket-15.wbbasket.ru";
  if (2406 <= nomenclature && nomenclature <= 2621) return "basket-16.wbbasket.ru";
  if (2622 <= nomenclature && nomenclature <= 2837) return "basket-17.wbbasket.ru";
  return "basket-18.wbbasket.ru";
};

// Генерация URL без явного basket-номера
const getPhotoUrl = (nomenclature) => {
  const domain = getUrl(Math.floor(nomenclature / 100000));
  return `https://${domain}/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/c246x328/1.webp`;
};

// Генерация URL с явным basket-номером
const getPhotoUrlWithoutUrl = (nomenclature, id) => {
  return `https://basket-${id}.wbbasket.ru/vol${Math.floor(nomenclature / 100000)}/part${Math.floor(nomenclature / 1000)}/${nomenclature}/images/c246x328/1.webp`;
};

// Асинхронная функция получения URL изображения
const getAllPhotoUrl = async (nomenclature) => {
  let url = getPhotoUrl(nomenclature);
  while (true) {
    const wbResponse = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!wbResponse.ok && wbResponse.status === 404) {
      const match = url.match(/\d+/);
      let number = match ? Number(match[0]) : null;
      number = number + 1;
      if (number > 30) break;
      url = getPhotoUrlWithoutUrl(nomenclature, number);
      continue;
    }
    if (wbResponse.ok) break;
  }
  console.log('Resolved photo URL:', url);
  return url;
};

export default function Overlay({ onClose, carouselItems = [], usedWords: initialUsedWords = [], unusedWords: initialUnusedWords = [] }) {
  const [isVisible, setIsVisible] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [usedWords, setUsedWords] = useState(initialUsedWords);
  const [unusedWords, setUnusedWords] = useState(initialUnusedWords);
  const [notifications, setNotifications] = useState([]); // Состояние для уведомлений

  // Анимации оверлея
  const overlayVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeIn' } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  // Анимации для keywordItem
  const keywordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  // Анимации для уведомлений
  const notificationVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  // Закрытие оверлея
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  // Загрузка URL изображений
  useEffect(() => {
    setIsVisible(true);

    const fetchPhotoUrls = async () => {
      const urls = await Promise.all(
        carouselItems.map(item => getAllPhotoUrl(item.id))
      );
      setPhotoUrls(urls);
    };

    if (carouselItems.length > 0) {
      fetchPhotoUrls();
    }
  }, [carouselItems]);

  // Добавление уведомления
  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000); // Уведомление исчезает через 3 секунды
  };

  // Перемещение слова из usedWords в unusedWords
  const handleRemoveWord = (word) => {
    if (usedWords.length <= 5) {
      addNotification('Нельзя удалить слово: минимум 5 слов в ключевых');
      return;
    }
    setUsedWords(prev => prev.filter(w => w !== word));
    setUnusedWords(prev => [...prev, word]);
  };

  // Перемещение слова из unusedWords в usedWords
  const handleAddWord = (word) => {
    if (usedWords.length >= 10) {
      addNotification('Нельзя добавить слово: максимум 10 слов в ключевых');
      return;
    }
    setUnusedWords(prev => prev.filter(w => w !== word));
    setUsedWords(prev => [...prev, word]);
  };

  // Форматируем carouselItems
  const formattedCarouselItems = carouselItems.map((item, index) => ({
    image: photoUrls[index] || '',
    title: item.name,
    rating: item.reviewRating ? `${item.reviewRating}/5` : 'Нет рейтинга',
    price: item.price ? `${(item.price / 100).toFixed(2)} ₽` : 'Нет цены',
  }));

  return (
    <motion.div
      className={styles.overlay}
      variants={overlayVariants}
      initial="hidden"
      animate={isVisible ? 'visible' : 'exit'}
    >
      <Button className={styles.closeBtn} onClick={handleClose}>
        <svg viewBox="2 2 28 28" style={{ fill: '#ffffff' }}>
          <path d="m18.828 16 4.586-4.586a2 2 0 1 0 -2.828-2.828l-4.586 4.586-4.586-4.586a2 2 0 0 0 -2.828 2.828l4.586 4.586-4.586 4.586a2 2 0 1 0 2.828 2.828l4.586-4.586 4.586 4.586a2 2 0 0 0 2.828-2.828z" />
        </svg>
      </Button>
      <div className={styles.container}>
        <Carousel
          items={
            formattedCarouselItems.length > 0
              ? formattedCarouselItems
              : [{ title: 'Нет данных', rating: 'N/A', price: 'N/A', image: '' }]
          }
        />
        <div className={styles.keywordContainer}>
          <h3>Ключевые слова</h3>
          <div className={`${styles.wordContainer} ${styles.green}`}>
            <AnimatePresence>
              {usedWords.length > 0 ? (
                usedWords.map((word, index) => (
                  <motion.div
                    key={word} // Используем само слово как ключ, предполагая уникальность
                    className={styles.keywordItem}
                    variants={keywordVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {word}
                    <button onClick={() => handleRemoveWord(word)}></button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="no-used"
                  className={styles.keywordItem}
                  variants={keywordVariants}
                  initial="hidden"
                  animate="visible"
                >
                  Нет использованных слов<button></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <h3>Не использованные ключевые слова</h3>
          <div className={`${styles.wordContainer} ${styles.red}`}>
            <AnimatePresence>
              {unusedWords.length > 0 ? (
                unusedWords.map((word, index) => (
                  <motion.div
                    key={word}
                    className={styles.keywordItem}
                    variants={keywordVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    {word}
                    <button onClick={() => handleAddWord(word)}></button>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="no-unused"
                  className={styles.keywordItem}
                  variants={keywordVariants}
                  initial="hidden"
                  animate="visible"
                >
                  Нет неиспользованных слов<button></button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Список уведомлений */}
      <div className={styles.notificationList}>
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              className={styles.notification}
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {notif.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}