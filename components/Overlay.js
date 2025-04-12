import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/Overlay.module.css';
import Button from './Button';
import Carousel from './Carousel';
import ConfirmationModal from './ConfirmationModal';

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

const LoadingAnimation = () => {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className={styles.loadingContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.loadingText}>
        Поиск товаров{dots}
      </div>
    </motion.div>
  );
};

export default function Overlay({ onClose, carouselItems = [], photoUrls = [], usedWords: initialUsedWords = [], unusedWords: initialUnusedWords = [], onWordChange, isGenerating, isSearchingProducts, setIsSearchingProducts }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCarouselReady, setIsCarouselReady] = useState(false);
  const [usedWords, setUsedWords] = useState(initialUsedWords);
  const [unusedWords, setUnusedWords] = useState(initialUnusedWords);
  const [notifications, setNotifications] = useState([]);
  const [isChanged, setIsChanged] = useState(false);
  const [hasAppliedChanges, setHasAppliedChanges] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  // Мемоизируем форматированные элементы карусели
  const formattedItems = useMemo(() => 
    carouselItems.map((item, index) => ({
      image: photoUrls[index] || '',
      title: item.name,
      rating: item.reviewRating ? `${item.reviewRating.toFixed(1)}/5` : 'Нет рейтинга',
      price: item.price ? `${(item.price / 100).toFixed(2)} ₽` : 'Нет цены',
    })),
    [carouselItems, photoUrls]
  );

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsCarouselReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAddWord = useCallback((word) => {
    if (isGenerating) {
      addNotification('Во время генерации нельзя менять настройки');
      return;
    }
    if (usedWords.length >= 10) {
      addNotification('Нельзя добавить слово: максимум 10 слов в ключевых');
      return;
    }
    setUnusedWords(prev => prev.filter(w => w !== word));
    setUsedWords(prev => [...prev, word]);
    setIsChanged(true);
  }, [usedWords.length, isGenerating]);

  const handleRemoveWord = useCallback((word) => {
    if (isGenerating) {
      addNotification('Во время генерации нельзя менять настройки');
      return;
    }
    if (usedWords.length <= 5) {
      addNotification('Нельзя удалить слово: минимум 5 слов в ключевых');
      return;
    }
    setUsedWords(prev => prev.filter(w => w !== word));
    setUnusedWords(prev => [...prev, word]);
    setIsChanged(true);
  }, [usedWords.length, isGenerating]);

  const addNotification = useCallback((message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    
    // Автоматически удаляем уведомление через 3 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const arraysAreEqual = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false;
      return arr1.every((item, index) => item === arr2[index]);
    };
    
    const isUsedWordsChanged = !arraysAreEqual(usedWords, initialUsedWords);
    const isUnusedWordsChanged = !arraysAreEqual(unusedWords, initialUnusedWords);
    setIsChanged(isUsedWordsChanged || isUnusedWordsChanged);
  }, [usedWords, unusedWords, initialUsedWords, initialUnusedWords]);

  const overlayVariants = {
    hidden: { 
      opacity: 0,
      y: '100%',
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring",
        damping: 30,
        stiffness: 300,
        duration: 0.5,
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0,
      y: '100%',
      transition: { 
        type: "spring",
        damping: 30,
        stiffness: 300,
        duration: 0.5,
        when: "afterChildren"
      }
    }
  };

  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200
      }
    },
    exit: { 
      opacity: 0,
      y: 50,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200
      }
    }
  };

  const carouselVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2
      }
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: 0.1
      }
    },
    exit: { 
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const handleSaveChanges = useCallback(async () => {
    if (isGenerating) {
      addNotification('Во время генерации нельзя менять настройки');
      return;
    }
    try {
      await onWordChange?.(usedWords, unusedWords);
      setIsChanged(false);
      setHasAppliedChanges(true);
      addNotification('Изменения сохранены успешно');
    } catch (error) {
      addNotification('Ошибка при сохранении изменений');
    }
  }, [usedWords, unusedWords, onWordChange, isGenerating, addNotification]);

  const handleClose = useCallback(() => {
    if (isGenerating) {
      addNotification('Во время генерации нельзя менять настройки');
      return;
    }
    if (isSearchingProducts) {
      addNotification('Подождите, идет поиск товаров...');
      return;
    }
    if (isChanged && !hasAppliedChanges) {
      setIsConfirmModalVisible(true);
      return;
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [isChanged, hasAppliedChanges, isGenerating, isSearchingProducts, onClose]);

  const handleConfirmClose = useCallback(async () => {
    await handleSaveChanges();
    setIsConfirmModalVisible(false);
  }, [handleSaveChanges]);

  const handleCancelClose = useCallback(() => {
    setIsConfirmModalVisible(false);
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <motion.div
      className={styles.overlay}
      variants={overlayVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      exit="exit"
      layoutId="overlay"
    >
      <ConfirmationModal 
        isVisible={isConfirmModalVisible}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        message="У вас есть несохраненные изменения. Хотите сохранить их перед закрытием?"
      />

      {/* Notifications should be rendered first in the DOM */}
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

      <Button 
        className={styles.closeBtn} 
        onClick={handleClose}
        disabled={isSearchingProducts}
      >
        <motion.svg 
          viewBox="0 0 24 24" 
          style={{ fill: '#ffffff', width: '24px', height: '24px' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </motion.svg>
      </Button>

      <motion.div
        className={styles.container}
        variants={containerVariants}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isSearchingProducts ? 'loading' : 'carousel'}
            className={styles.carouselContainer}
            variants={carouselVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isSearchingProducts ? (
              <LoadingAnimation />
            ) : (
              isCarouselReady && (
                <Carousel items={formattedItems.length > 0 ? formattedItems : [{ title: 'Нет данных', rating: 'N/A', price: 'N/A', image: '' }]} />
              )
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div 
          className={styles.keywordContainer}
          variants={containerVariants}
        >
          <h3>Ключевые слова</h3>
          <div className={`${styles.wordContainer} ${styles.green}`}>
            <AnimatePresence mode="popLayout">
              {usedWords.map((word, index) => (
                <motion.div
                  key={`used-${word}-${index}`}
                  layoutId={`word-${word}`}
                  className={styles.keywordItem}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.5,
                    duration: 0.3
                  }}
                >
                  {word}
                  <button onClick={() => handleRemoveWord(word)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <h3>Не использованные ключевые слова</h3>
          <div className={`${styles.wordContainer} ${styles.red}`}>
            <AnimatePresence mode="popLayout">
              {unusedWords.map((word, index) => (
                <motion.div
                  key={`unused-${word}-${index}`}
                  layoutId={`word-${word}`}
                  className={styles.keywordItem}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.5,
                    duration: 0.3
                  }}
                >
                  {word}
                  <button onClick={() => handleAddWord(word)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {isChanged && (
            <motion.div
              className={styles.saveButtonContainer}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Button
                onClick={handleSaveChanges}
                className={styles.saveButton}
              >
                Сохранить изменения
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}